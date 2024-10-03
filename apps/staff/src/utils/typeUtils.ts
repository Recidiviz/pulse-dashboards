// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

// The functions below are slightly modified from
// https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts

export type Expect<T extends true> = T;
export type ExpectTrue<T extends true> = T;
export type ExpectFalse<T extends false> = T;
export type IsTrue<T extends true> = T;
export type IsFalse<T extends false> = T;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;

// https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type NotAny<T> = true extends IsAny<T> ? false : true;

export type Debug<T> = { [K in keyof T]: T[K] };
// eslint-disable-next-line @typescript-eslint/ban-types
export type MergeInsertions<T> = T extends object
  ? { [K in keyof T]: MergeInsertions<T[K]> }
  : T;

export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>;

export type Extends<EXPECTED, VALUE> = EXPECTED extends VALUE ? true : false;
export type ValidArgs<
  FUNC extends (...args: any[]) => any,
  ARGS extends any[],
> = ARGS extends Parameters<FUNC> ? true : false;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type PartialRecord<K extends string | number | symbol, V> = Partial<
  Record<K, V>
>;

export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// This is a useful utility for Zod types using unions.
// Given the schema
// z.object({'foo': z.number()}).union([
//    z.object({'bar': z.number()}),
//    z.object({'zap': z.number()}),
// ]),
// we generate the type `SchemaType = {foo: number, bar: number} | {foo: number, zap: number}
// the standard `keyof SchemaType` will return `"foo"`
// AllPossibleKeys<SchemaType> will return `"foo" | "bar" | "zap"`
// This is due to "Distributive Conditional Types"
// https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
export type AllPossibleKeys<T> = T extends any ? keyof T : never;

// If T includes both named properties and a fallback index signature,
// RemoveIndexSignature<T> includes just the explicitly named properties
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};
