"use strict";

exports.AuthAction = { READ_ANY: "READ_ANY", UPDATE_ANY: "UPDATE_ANY" };
exports.Resource = { SERVICES: "SERVICES" };
exports.UsePermissions = function UsePermissions() {
  return function permissionDecorator() {};
};
