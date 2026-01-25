import Element from '../element/Element.js';
import ICachedResult from './ICachedResult.js';
export default interface ICachedQuerySelectorResult extends ICachedResult {
    result: WeakRef<Element> | false | null;
}
//# sourceMappingURL=ICachedQuerySelectorResult.d.ts.map