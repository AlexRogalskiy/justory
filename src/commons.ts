import { sha1 } from 'object-hash'

import { Checkers } from './checkers'
import { Errors } from './errors'
import { Objects } from './objects'

export namespace Commons {
    const WINDOW_USER_SCRIPT_VARIABLE = '__USER__'

    export const getUserScript = (value: string): string => {
        return `${WINDOW_USER_SCRIPT_VARIABLE} = ${JSON.stringify(value)};`
    }

    const discardSingle = <A>(obj: A, toDiscard: string): A => {
        const result = {}
        const keys = Object.keys(obj)
        for (const key of keys) {
            if (key !== toDiscard && Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = obj[key]
            }
        }

        return result as A
    }

    const discardMany = <A>(obj: A, toDiscard: string[]): A => {
        const result = {}
        const keys = Object.keys(obj)
        for (const key of keys) {
            if (-1 === toDiscard.indexOf(key) && Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = obj[key]
            }
        }

        return result as A
    }

    export const toBoolean = (value: unknown): boolean => {
        return (
            (typeof value === 'string' && /true/i.test(value)) ||
            value === true ||
            value === 'true' ||
            value === 1 ||
            value === '1' ||
            value === 'on' ||
            value === 'yes'
        )
    }

    export const getTagsByCode = (tags): unknown => {
        return tags.reduce((acc, tag) => {
            return { ...acc, [tag.code]: { ...tag, id: tag.code } }
        }, {})
    }

    export const toPrimitive = <T>(obj: T): any => {
        let funct, val, _i, _len
        let functions = ['valueOf', 'toString']

        if (typeof obj === 'object') {
            if (obj instanceof Date) {
                functions = ['toString', 'valueOf']
            }

            for (_i = 0, _len = functions.length; _i < _len; _i++) {
                funct = functions[_i]
                if (typeof obj[funct] === 'function') {
                    val = obj[funct]()
                    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                        return val
                    }
                }
            }

            throw new Error('Default value is ambiguous.')
        }
        return obj
    }

    export const getUniqueId = (() => {
        let id = 0
        return element => {
            if (!element.id) {
                element.id = `generated-uid-${id++}`
            }
            return element.id
        }
    })()

    export const directions = (...args): void => {
        const [start, ...remaining] = args
        const [finish, ...stops] = remaining.reverse()

        console.log(`drive through ${args.length} towns`)
        console.log(`start in ${start}`)
        console.log(`the destination is ${finish}`)
        console.log(`stopping ${stops.length} times in between`)
    }

    export const dispatcher = {
        join(before: any, after: any) {
            return `${before}:${after}`
        },
        sum(...rest: any[]) {
            return rest.reduce((prevValue: any, curValue: any): any => {
                return prevValue + curValue
            })
        },
    }

    export const hash = (...args: any[]): string => {
        return sha1(...args)
    }

    // console.log(mediator.relay('join', 'bar', 'baz'));
    export const mediator = {
        relay(method: string, ...args: any[]) {
            return dispatcher[method](...args)
        },
    }

    // const iterator = getCurrency();
    // console.log(iterator.next());
    export function* getCurrency(): Generator<string> {
        console.log('the generator function has started')
        const currencies = ['NGN', 'USD', 'EUR', 'GBP', 'CAD']
        for (const currency of currencies) {
            yield currency
        }
        console.log('the generator function has ended')
    }

    export const isEmpty = (value: any): boolean => {
        return (
            value === void 0 ||
            value === '' ||
            String(value).toLocaleLowerCase() === 'null' ||
            value === 'undefined' ||
            (typeof value === 'object' && Object.keys(value).length === 0)
        )
    }

    export function discard<A>(a: A, toDiscard: string | string[]): A {
        return typeof toDiscard === 'string' ? discardSingle(a, toDiscard) : discardMany(a, toDiscard)
    }

    export const defineAccessorProperty = (obj: any, prop: PropertyKey, value: any): any => {
        return Object.defineProperty(obj, prop, {
            get: () => value,
            set: newValue => (value = newValue),
            enumerable: true,
            configurable: true,
        })
    }

    export const defineProperty = (
        obj: any,
        prop: PropertyKey,
        attrs: PropertyDescriptor = { writable: true, enumerable: true, configurable: true },
    ): any => {
        return Object.defineProperty(obj, prop, attrs)
    }

    export const defineStaticProperty = (
        obj: any,
        prop: PropertyKey,
        attrs: { __proto__?: null; value: any },
    ): any => {
        // Object.defineProperty(obj, prop, withValue('static'));
        return Object.defineProperty(obj, prop, attrs)
    }

    export const freeze = (obj: any): void => {
        // if freeze is available, prevents adding or
        // removing the object prototype properties
        // (value, get, set, enumerable, writable, configurable)
        ;(Object.freeze || Object)(obj.prototype)
    }

    export const withValue = (value: any): any => {
        const d =
            withValue['d'] ||
            (withValue['d'] = {
                enumerable: false,
                writable: false,
                configurable: false,
                value: null,
            })
        d.value = value

        return d
    }

    // adding a writable data descriptor - not configurable, not enumerable
    // Object.setProperty(4, myObj, 'myNumber', 25);
    // adding a readonly data descriptor - not configurable, enumerable
    // Object.setProperty(1, myObj, 'myString', 'Hello world!');
    export const createProperty = (global: any): void => {
        Object['setProperty'] = (
            mask: number,
            obj: any,
            prop: PropertyKey,
            getter: any,
            setter: any,
        ): any => {
            if (mask & 8) {
                // accessor descriptor
                if (Checkers.isFunction(getter)) {
                    global.get = getter
                } else {
                    delete global.get
                }
                if (Checkers.isFunction(setter)) {
                    global.set = setter
                } else {
                    delete global.set
                }
                delete global.value
                delete global.writable
            } else {
                // data descriptor
                if (Checkers.isFunction(getter)) {
                    global.value = getter()
                } else {
                    delete global.value
                }
                global.writable = Boolean(mask & 4)
                delete global.get
                delete global.set
            }
            global.enumerable = Boolean(mask & 1)
            global.configurable = Boolean(mask & 2)
            Object.defineProperty(obj, prop, global)

            return obj
        }
    }

    // addMethod(this, "find", () => {})
    // addMethod(this, "find", (name) => {})
    // addMethod(this, "find", (first, last) => {})
    export const addMethod = (obj: any, name: string, fn, ...args: any[]): any => {
        const old = obj[name]
        obj[name] = () => {
            if (fn.length === args.length) {
                return fn.apply(obj, args)
            } else if (typeof old === 'function') {
                return old.apply(obj, args)
            }
        }
    }

    /**
     * Creates A function expression from the specified string lambda expression
     * @param {String} exp String lambda expression.
     * @returns {Function}
     */
    export const lambda = (exp: any): any => {
        if (typeof exp === 'function') {
            return exp
        } else if (typeof exp === 'string') {
            const _pattern = /^\s*\(?\s*(([a-z_$][a-z0-9_$]*)+([, ]+[a-z_$][a-z0-9_$]*)*)*\s*\)?\s*=>\s*(.*)$/i
            if (_pattern.test(exp)) {
                const _match = exp.match(_pattern)
                return new Function(
                    ((_match && _match[1]) || '').replace(/ /g, ''),
                    `return ${_match && _match[4]}`,
                )
            }

            throw Errors.valueError(`Cannot parse supplied expression: ${exp}`)
        }

        return null
    }

    /**
     * Determines whether the specified object instances are considered equal. calls the overridden "equals" method when available.
     * @param {Object} objA The first object to compare.
     * @param {Object} objB The second object to compare.
     * @returns {Boolean} true if the objA parameter is the same instance as the objB parameter, or if both are null, or if objA.equals(objB) returns true; otherwise, false.
     */
    export const equals = (objA: any, objB: any): boolean => {
        if (objA === objB) {
            return true // Objects are identical (including null)
        } else if (objA == null || objB == null) {
            return false
        }

        return sha1(objA) === sha1(objB) && Objects.shallowEquals(objA, objB)
    }

    /**
     * Returns a boolean indicating whether the object has the specified property.
     * @param {Object} obj An object.
     * @param {String} prop A property name.
     * @returns {Boolean}
     */
    export const hasProperty = (obj: any, prop: PropertyKey): boolean => {
        if (Checkers.isNull(obj)) return false
        return Checkers.isFunction(obj.hasOwnProperty) ? obj.hasOwnProperty(prop) : prop in obj
    }

    /**
     * Determines whether the specified object instances are considered equal.
     */
    export const computeEquals = (() => {
        const _equalsSymbol = '__equals__'
        const _eqSymbol = 'eq'

        /**
         * Determines whether the specified object instances are considered equal.
         * @param {Object} objA The first object to compare.
         * @param {Object} objB The second object to compare.
         * @param {Boolean} override When true, uses the overriden __equals__ function if it is defined.
         * @returns {Boolean}
         */
        const computeEquals = (objA, objB, override): boolean => {
            // Objects are identical (including null)
            if (objA === objB) {
                return true
            }

            // null is not equal to any object
            else if (objA == null || objB == null) {
                return false
            }

            // Objects check for equality for primitive types
            if (typeof objA === 'number' || typeof objA === 'string' || typeof objA === 'boolean') {
                return objA === objB
            } else if (typeof objA === 'object') {
                // Objects are from "Date" type
                if (objA instanceof Date) {
                    return computeDateEquals(objA, objB)
                } else if (override && typeof objA.__equals__ === 'function') {
                    return objA.__equals__(objB)
                }

                return computeObjectEquals(objA, objB)
            }

            // Objects are already not equal
            return false
        }

        // Compares Date objects by their time
        const computeDateEquals = (objA: any, objB: any): boolean => {
            return objA instanceof Date && objB instanceof Date && objA.getTime() === objB.getTime()
        }

        // Compares Primitive objects
        const computePrimitiveEquals = (objA: any, objB: any): boolean => {
            return objA === objB
        }

        // Compares Object types by their Hash code and Properties
        const computeObjectEquals = (objA: any, objB: any): boolean => {
            if (typeof objA === 'object' && typeof objB === 'object') {
                if (sha1(objA, true) !== sha1(objB, true)) {
                    return false
                }

                /// Process equality for object literals:
                /// object literals may have equal hash code, we process equality by each property.
                /// regular "class" instances have different hash code, hence do not fall into following code.
                /// object objA is direct descendant of Object hence no need to check "hasOwnProperty"

                let _val

                for (const _prop in objA) {
                    if (hasProperty(objA, _prop)) {
                        _val = objA[_prop]

                        /// Object methods are not considered for equality
                        if (typeof _val === 'function') {
                            continue
                        }

                        if (hasProperty(objB, _prop)) {
                            if (!computeEquals(_val, objB[_prop], true)) {
                                return false
                            }
                        }
                    }

                    /// no need to browse objB properties, all properties of objA is checked against objB
                    /// it is very unlikely for object literals with the same hash code to have different properties
                    /// even in such a rare case, objects are considered equal

                    return true
                }
            }

            // Objects are equal (with auto type conversion)
            // Objects from the same type are considered equal (eg. new Number(1) and 1)
            return objA === objB
        }

        /// Define "__equals__" function for built-in types
        defineStaticProperty(Date, _equalsSymbol, {
            value: (obj1, obj2) => computeDateEquals(obj1, obj2),
        })

        defineStaticProperty(Number, _equalsSymbol, {
            value: (obj1, obj2) => computePrimitiveEquals(obj1, obj2),
        })

        defineStaticProperty(String, _equalsSymbol, {
            value: (obj1, obj2) => computePrimitiveEquals(obj1, obj2),
        })

        defineStaticProperty(Boolean, _equalsSymbol, {
            value: (obj1, obj2) => computePrimitiveEquals(obj1, obj2),
        })

        defineStaticProperty(Object, _equalsSymbol, {
            value: (obj1, obj2) => computeObjectEquals(obj1, obj2),
        })

        defineProperty(Date.prototype, _eqSymbol, {
            value(obj) {
                return computeDateEquals(this, obj)
            },
        })

        defineProperty(Number.prototype, _eqSymbol, {
            value(obj) {
                return computePrimitiveEquals(this, obj)
            },
        })

        defineProperty(String.prototype, _eqSymbol, {
            value(obj) {
                return computePrimitiveEquals(this, obj)
            },
        })

        defineProperty(Boolean.prototype, _eqSymbol, {
            value(obj) {
                return computePrimitiveEquals(this, obj)
            },
        })

        defineProperty(Object.prototype, _eqSymbol, {
            value(obj) {
                return computeObjectEquals(this, obj)
            },
        })

        return computeEquals
    })()

    /**
     * Performs a comparison of two objects of the same type and returns a value indicating whether one object is less than, equal to, or greater than the other.
     */
    export const computeCompare = (() => {
        /**
         * Performs a comparison of two objects of the same type and returns a value indicating whether one object is less than, equal to, or greater than the other.
         * @param {Object} objA The first object to compare.
         * @param {Object} objB The second object to compare.
         * @returns {Number}
         */
        const computeCompare_ = (objA: any, objB: any): number => {
            if (objA === objB) {
                // Identical objects
                return 0
            } else if (objA == null) {
                // null or undefined is less than everything
                return -1
            } else if (objB == null) {
                // Everything is greater than null or undefined
                return 1
            }
            if (
                typeof objA === 'number' || // numbers compare using "gt" operator
                typeof objA === 'boolean'
            ) {
                // booleans compare using "gt" operator
                return objA > objB ? 1 : -1 // values are already checked to equality
            } else if (typeof objA === 'string') {
                return objA.localeCompare(objB) // Strings are compared using String.prototype.localeCompare method
            }

            if (
                objA instanceof Date && // Dates are compared using 'getTime' method
                objB instanceof Date
            ) {
                const _t1 = objA.getTime(),
                    _t2 = objB.getTime()

                return _t1 > _t2 ? 1 : _t2 > _t1 ? -1 : 0
            } else {
                // Objects are compared using 'valueOf' method
                const _v1 = objA.valueOf(),
                    _v2 = objB.valueOf()

                return _v1 > _v2 ? 1 : _v2 > _v1 ? -1 : 0
            }
        }

        return computeCompare_
    })()
}
