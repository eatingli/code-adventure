/**
 *Simple delay function.
 *@param {Number} ms
 *@param {...*} [args]
 * @returns {Promise}
 */
export function delay(ms, ...args) {

  const deferred = {};
  deferred.promise = new Promise((res, rej) => {
    deferred.resolve = res;
    deferred.reject = rej;
  });

  //argument array will pass to deferred.resolve
  setTimeout(deferred.resolve, ms, args);
  return deferred.promise;
}
