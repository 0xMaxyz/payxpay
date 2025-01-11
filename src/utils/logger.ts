class logger {
  static info = function (message?: string, ...optionalParams: string[]) {
    console.log(
      new Date(Date.now()).toUTCString(),
      "::",
      message,
      ...optionalParams
    );
  };
  static error = function (message?: string, ...optionalParams: string[]) {
    console.error(
      new Date(Date.now()).toUTCString(),
      "::",
      message,
      ...optionalParams
    );
  };
}

export default logger;
