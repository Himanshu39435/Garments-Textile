/** Consistent JSON envelope: { success, message, data, meta } */
export default class ApiResponse {
  static send(res, statusCode, message, data = null, meta = undefined) {
    return res.status(statusCode).json({ success: true, message, data, ...(meta && { meta }) });
  }
  static ok(res, data, message = 'Success', meta) { return ApiResponse.send(res, 200, message, data, meta); }
  static created(res, data, message = 'Created') { return ApiResponse.send(res, 201, message, data); }
}
