"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphqlSchemaExtension = exports.ApiModule = exports.adapter = void 0;
exports.adapter = 'nestjs';
var api_module_1 = require("./api.module");
Object.defineProperty(exports, "ApiModule", { enumerable: true, get: function () { return api_module_1.ApiModule; } });
var graphql_types_1 = require("./graphql.types");
Object.defineProperty(exports, "graphqlSchemaExtension", { enumerable: true, get: function () { return graphql_types_1.graphqlSchemaExtension; } });
