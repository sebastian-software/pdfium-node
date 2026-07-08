#include <node_api.h>

#include <string>

namespace {

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

napi_value GetNativeBuildInfo(napi_env env, napi_callback_info /* info */) {
  napi_value result;
  napi_create_object(env, &result);

  napi_set_named_property(env, result, "backend", MakeString(env, "node-api"));
  napi_set_named_property(env, result, "platform", MakeString(env, "darwin"));
  napi_set_named_property(env, result, "arch", MakeString(env, "arm64"));
  napi_set_named_property(env, result, "pdfiumLinked", MakeBoolean(env, false));

  return result;
}

napi_value RenderPdfThumbnailsNative(napi_env env, napi_callback_info /* info */) {
  napi_throw_error(
    env,
    "PDFIUM_NODE_PDFIUM_ERROR",
    "Native PDFium addon is built, but PDFium is not linked yet.");
  return nullptr;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_value render;
  napi_create_function(
    env,
    "renderPdfThumbnailsNative",
    NAPI_AUTO_LENGTH,
    RenderPdfThumbnailsNative,
    nullptr,
    &render);
  napi_set_named_property(env, exports, "renderPdfThumbnailsNative", render);

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
