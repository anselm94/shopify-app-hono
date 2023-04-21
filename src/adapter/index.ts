import {
  setAbstractFetchFunc,
  setAbstractConvertRequestFunc,
  setAbstractConvertResponseFunc,
  setAbstractConvertHeadersFunc,
  setAbstractRuntimeString,
  setCrypto,
} from '@shopify/shopify-api/runtime';

import {
  honoFetch,
  honoConvertRequest,
  honoConvertResponse,
  honoConvertHeaders,
  honoRuntimeString,
} from './adapter';

setAbstractFetchFunc(honoFetch);
setAbstractConvertRequestFunc(honoConvertRequest);
setAbstractConvertResponseFunc(honoConvertResponse);
setAbstractConvertHeadersFunc(honoConvertHeaders);
setAbstractRuntimeString(honoRuntimeString);
setCrypto(crypto as any);
