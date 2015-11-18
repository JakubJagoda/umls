/*
 * jQuery has no default export so it returns jQueryFactory instead of jQuery
 * when used with ES6 imports
 */
import * as jQueryFactory from 'jquery';
const $ : JQueryStatic = jQueryFactory.noConflict();
export default $;
