import * as debug from 'debug';

let logger = {
  debug: debug('deepstream-rxjs')
};

let logger = {
  debug: console.log
};

export { logger as Logger };
