/*
 * Fix TypeScript's problem with `import template from 'file.html'
 * `require` needs to be used which is not defined in TypeScript
 */
declare function require(path:string):HandlebarsTemplateDelegate;
