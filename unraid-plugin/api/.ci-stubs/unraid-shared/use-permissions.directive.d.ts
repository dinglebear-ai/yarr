export declare enum AuthAction {
  READ_ANY = "READ_ANY",
  UPDATE_ANY = "UPDATE_ANY",
}

export declare enum Resource {
  SERVICES = "SERVICES",
}

export declare function UsePermissions(permissions: {
  action: AuthAction;
  resource: Resource;
}): MethodDecorator;
