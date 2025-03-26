"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterSchema = void 0;
exports.Controller = Controller;
exports.Get = Get;
exports.Post = Post;
exports.Put = Put;
exports.Delete = Delete;
exports.Patch = Patch;
exports.Redirect = Redirect;
exports.HttpCode = HttpCode;
exports.Body = Body;
exports.Queries = Queries;
exports.Param = Param;
exports.Query = Query;
exports.Header = Header;
exports.Headers = Headers;
exports.Request = Request;
exports.Req = Req;
exports.Response = Response;
exports.Res = Res;
exports.Next = Next;
exports.Session = Session;
exports.User = User;
exports.Ip = Ip;
exports.HostParam = HostParam;
const controller_registry_1 = require("../registries/controller.registry");
function Controller(prefix = '') {
    return (target) => {
        Reflect.defineMetadata('controller_prefix', prefix, target);
        controller_registry_1.ControllerRegistry.registerController(target, prefix);
    };
}
function createMethodDecorator(method, path, cb, metadata) {
    return (target, propertyKey, context) => {
        controller_registry_1.ControllerRegistry.registerRoute(target, method, path, propertyKey, context.value, cb, metadata);
    };
}
function createRouteMiddleware(middleware, descriptor) {
    const existingFields = Reflect.getMetadata('route_metadata', descriptor.value) || {};
    const newField = existingFields?.middleware
        ? { middleware: [...existingFields?.middleware, middleware] }
        : { middleware: [middleware] };
    Reflect.defineMetadata('route_metadata', { ...existingFields, ...newField }, descriptor.value);
}
var RouterSchema;
(function (RouterSchema) {
    RouterSchema[RouterSchema["GetAll"] = 0] = "GetAll";
    RouterSchema[RouterSchema["GetByID"] = 1] = "GetByID";
    RouterSchema[RouterSchema["GetIn"] = 2] = "GetIn";
    RouterSchema[RouterSchema["Raw"] = 3] = "Raw";
    RouterSchema[RouterSchema["Insert"] = 4] = "Insert";
    RouterSchema[RouterSchema["Update"] = 5] = "Update";
    RouterSchema[RouterSchema["Delete"] = 6] = "Delete";
    RouterSchema[RouterSchema["Import"] = 7] = "Import";
    RouterSchema[RouterSchema["Export"] = 8] = "Export";
})(RouterSchema || (exports.RouterSchema = RouterSchema = {}));
function Get(pathOrMetadata, metadata) {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator('get', '', undefined, pathOrMetadata);
    return createMethodDecorator('get', pathOrMetadata ?? '', undefined, metadata);
}
function Post(pathOrMetadata, metadata) {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator('post', '', undefined, pathOrMetadata);
    return createMethodDecorator('post', pathOrMetadata ?? '', undefined, metadata);
}
function Put(pathOrMetadata, metadata) {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator('put', '', undefined, pathOrMetadata);
    return createMethodDecorator('put', pathOrMetadata ?? '', undefined, metadata);
}
function Delete(pathOrMetadata, metadata) {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator('delete', '', undefined, pathOrMetadata);
    return createMethodDecorator('delete', pathOrMetadata ?? '', undefined, metadata);
}
function Patch(pathOrMetadata, metadata) {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator('patch', '', undefined, pathOrMetadata);
    return createMethodDecorator('patch', pathOrMetadata ?? '', undefined, metadata);
}
function Redirect(url, statusCode) {
    return (target, propertyKey, descriptor) => {
        const middleware = async (request, response, next) => {
            if (response?.res) {
                response.res.writeHead(statusCode, { Location: url });
                response.res.end();
            }
        };
        createRouteMiddleware(middleware, descriptor);
    };
}
function HttpCode(statusCode) {
    return (target, propertyKey, descriptor) => {
        const middleware = async (request, response, next) => {
            response.code(statusCode);
            next();
        };
        createRouteMiddleware(middleware, descriptor);
    };
}
function createParamDecorator(paramType) {
    return (target, propertyKey, parameterIndex) => {
        const paramName = paramType.startsWith('param') ||
            paramType.startsWith('query') ||
            paramType.startsWith('header')
            ? paramType.split(':')[1]
            : paramType;
        controller_registry_1.ControllerRegistry.registerParam(target, propertyKey, paramType, parameterIndex, paramName);
    };
}
function Body() {
    return createParamDecorator('body');
}
function Queries() {
    return createParamDecorator(`queries`);
}
function Param(paramName) {
    return createParamDecorator(`param:${paramName}`);
}
function Query(queryName) {
    return createParamDecorator(`query:${queryName}`);
}
function Header(headerName) {
    return createParamDecorator(`header:${headerName}`);
}
function Headers() {
    return createParamDecorator(`headers`);
}
function Request() {
    return createParamDecorator(`request`);
}
function Req() {
    return createParamDecorator(`request`);
}
function Response() {
    return createParamDecorator(`response`);
}
function Res() {
    return createParamDecorator(`response`);
}
function Next() {
    return createParamDecorator(`next`);
}
function Session() {
    return createParamDecorator(`session`);
}
function User() {
    return createParamDecorator(`user`);
}
function Ip() {
    return createParamDecorator(`ip`);
}
function HostParam() {
    return createParamDecorator(`hosts`);
}
