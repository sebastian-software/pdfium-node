#include <node_api.h>
#include <fpdfview.h>

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <mutex>
#include <string>
#include <vector>

namespace {

std::once_flag pdfium_once;

void InitPdfium() {
  FPDF_InitLibrary();
}

napi_value MakeString(napi_env env, const char* value) {
  napi_value result;
  napi_create_string_utf8(env, value, NAPI_AUTO_LENGTH, &result);
  return result;
}

napi_value MakeBoolean(napi_env env, bool value) {
  napi_value result;
  napi_get_boolean(env, value, &result);
  return result;
}

napi_value MakeNumber(napi_env env, double value) {
  napi_value result;
  napi_create_double(env, value, &result);
  return result;
}

void Throw(napi_env env, const char* code, const char* message) {
  napi_throw_error(env, code, message);
}

bool GetNamedValue(napi_env env, napi_value object, const char* name, napi_value* value) {
  bool has_property = false;
  napi_has_named_property(env, object, name, &has_property);
  if (!has_property) {
    return false;
  }

  napi_get_named_property(env, object, name, value);
  return true;
}

uint32_t GetUint32Option(napi_env env, napi_value options, const char* name, uint32_t fallback) {
  napi_value value;
  if (!GetNamedValue(env, options, name, &value)) {
    return fallback;
  }

  uint32_t result = fallback;
  napi_get_value_uint32(env, value, &result);
  return result;
}

std::vector<int> GetPages(napi_env env, napi_value options) {
  napi_value pages_value;
  if (!GetNamedValue(env, options, "pages", &pages_value)) {
    return {};
  }

  uint32_t length = 0;
  napi_get_array_length(env, pages_value, &length);

  std::vector<int> pages;
  pages.reserve(length);

  for (uint32_t index = 0; index < length; index += 1) {
    napi_value page_value;
    napi_get_element(env, pages_value, index, &page_value);

    int32_t page = 0;
    napi_get_value_int32(env, page_value, &page);
    pages.push_back(page);
  }

  return pages;
}

const char* PdfiumLoadErrorCode() {
  switch (FPDF_GetLastError()) {
    case FPDF_ERR_PASSWORD:
      return "PDFIUM_NODE_PASSWORD_REQUIRED";
    case FPDF_ERR_FORMAT:
    case FPDF_ERR_FILE:
      return "PDFIUM_NODE_MALFORMED_PDF";
    default:
      return "PDFIUM_NODE_PDFIUM_ERROR";
  }
}

napi_value RenderPdfPagesRaw(napi_env env, napi_callback_info info) {
  std::call_once(pdfium_once, InitPdfium);

  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    Throw(env, "PDFIUM_NODE_INVALID_OPTIONS", "Expected PDF bytes and render options.");
    return nullptr;
  }

  bool is_typed_array = false;
  napi_is_typedarray(env, args[0], &is_typed_array);
  if (!is_typed_array) {
    Throw(env, "PDFIUM_NODE_INVALID_OPTIONS", "PDF input must be a Uint8Array.");
    return nullptr;
  }

  napi_typedarray_type type;
  size_t byte_length = 0;
  void* data = nullptr;
  napi_value array_buffer;
  size_t byte_offset = 0;
  napi_get_typedarray_info(
    env,
    args[0],
    &type,
    &byte_length,
    &data,
    &array_buffer,
    &byte_offset);

  if (byte_length == 0) {
    Throw(env, "PDFIUM_NODE_MALFORMED_PDF", "PDF input is empty.");
    return nullptr;
  }

  FPDF_DOCUMENT document = FPDF_LoadMemDocument(data, static_cast<int>(byte_length), nullptr);
  if (!document) {
    Throw(env, PdfiumLoadErrorCode(), "PDFium failed to load the PDF document.");
    return nullptr;
  }

  const int page_count = FPDF_GetPageCount(document);
  std::vector<int> pages = GetPages(env, args[1]);
  const uint32_t max_width = GetUint32Option(env, args[1], "maxWidth", 1000);
  const uint32_t max_pixels = GetUint32Option(env, args[1], "maxPixels", 4000000);

  napi_value result;
  napi_create_array_with_length(env, pages.size(), &result);

  for (size_t result_index = 0; result_index < pages.size(); result_index += 1) {
    const int requested_page = pages[result_index];
    if (requested_page < 1 || requested_page > page_count) {
      FPDF_CloseDocument(document);
      Throw(env, "PDFIUM_NODE_INVALID_PAGE", "Requested page is outside the document page range.");
      return nullptr;
    }

    FPDF_PAGE page = FPDF_LoadPage(document, requested_page - 1);
    if (!page) {
      FPDF_CloseDocument(document);
      Throw(env, "PDFIUM_NODE_PDFIUM_ERROR", "PDFium failed to load the requested page.");
      return nullptr;
    }

    const double page_width_points = FPDF_GetPageWidth(page);
    const double page_height_points = FPDF_GetPageHeight(page);
    const double scale = static_cast<double>(max_width) / page_width_points;
    const int width = std::max(1, static_cast<int>(std::round(page_width_points * scale)));
    const int height = std::max(1, static_cast<int>(std::round(page_height_points * scale)));

    if (static_cast<uint64_t>(width) * static_cast<uint64_t>(height) > max_pixels) {
      FPDF_ClosePage(page);
      FPDF_CloseDocument(document);
      Throw(env, "PDFIUM_NODE_PIXEL_LIMIT_EXCEEDED", "Rendered bitmap exceeds maxPixels.");
      return nullptr;
    }

    FPDF_BITMAP bitmap = FPDFBitmap_Create(width, height, 1);
    if (!bitmap) {
      FPDF_ClosePage(page);
      FPDF_CloseDocument(document);
      Throw(env, "PDFIUM_NODE_PDFIUM_ERROR", "PDFium failed to allocate a bitmap.");
      return nullptr;
    }

    FPDFBitmap_FillRect(bitmap, 0, 0, width, height, 0xFFFFFFFF);
    FPDF_RenderPageBitmap(bitmap, page, 0, 0, width, height, 0, FPDF_ANNOT);

    const int stride = FPDFBitmap_GetStride(bitmap);
    const auto* source = static_cast<const uint8_t*>(FPDFBitmap_GetBuffer(bitmap));
    std::vector<uint8_t> rgba(static_cast<size_t>(width) * static_cast<size_t>(height) * 4);

    for (int y = 0; y < height; y += 1) {
      const uint8_t* source_row = source + static_cast<size_t>(y) * stride;
      uint8_t* target_row = rgba.data() + static_cast<size_t>(y) * width * 4;

      for (int x = 0; x < width; x += 1) {
        const uint8_t blue = source_row[x * 4 + 0];
        const uint8_t green = source_row[x * 4 + 1];
        const uint8_t red = source_row[x * 4 + 2];
        const uint8_t alpha = source_row[x * 4 + 3];

        target_row[x * 4 + 0] = red;
        target_row[x * 4 + 1] = green;
        target_row[x * 4 + 2] = blue;
        target_row[x * 4 + 3] = alpha;
      }
    }

    napi_value item;
    napi_create_object(env, &item);
    napi_set_named_property(env, item, "page", MakeNumber(env, requested_page));
    napi_set_named_property(env, item, "width", MakeNumber(env, width));
    napi_set_named_property(env, item, "height", MakeNumber(env, height));

    void* buffer_data = nullptr;
    napi_value buffer;
    napi_create_buffer_copy(env, rgba.size(), rgba.data(), &buffer_data, &buffer);
    napi_set_named_property(env, item, "data", buffer);

    napi_set_element(env, result, static_cast<uint32_t>(result_index), item);

    FPDFBitmap_Destroy(bitmap);
    FPDF_ClosePage(page);
  }

  FPDF_CloseDocument(document);
  return result;
}

napi_value GetNativeBuildInfo(napi_env env, napi_callback_info /* info */) {
  napi_value result;
  napi_create_object(env, &result);

  napi_set_named_property(env, result, "backend", MakeString(env, "node-api"));
  napi_set_named_property(env, result, "platform", MakeString(env, "darwin"));
  napi_set_named_property(env, result, "arch", MakeString(env, "arm64"));
  napi_set_named_property(env, result, "pdfiumLinked", MakeBoolean(env, true));
  napi_set_named_property(env, result, "pdfiumSource", MakeString(env, "bblanchon/pdfium-binaries"));
  napi_set_named_property(env, result, "pdfiumRevision", MakeString(env, "chromium/7934"));

  return result;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_value render;
  napi_create_function(
    env,
    "renderPdfPagesRaw",
    NAPI_AUTO_LENGTH,
    RenderPdfPagesRaw,
    nullptr,
    &render);
  napi_set_named_property(env, exports, "renderPdfPagesRaw", render);

  napi_value info;
  napi_create_function(
    env,
    "getNativeBuildInfo",
    NAPI_AUTO_LENGTH,
    GetNativeBuildInfo,
    nullptr,
    &info);
  napi_set_named_property(env, exports, "getNativeBuildInfo", info);

  return exports;
}

}  // namespace

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
