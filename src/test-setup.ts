/**
 * Test setup file - Polyfills for browser APIs
 * This file is preloaded before running tests
 */

// DOM polyfill for React testing
import { Window } from 'happy-dom';

const happyWindow = new Window({ url: 'http://localhost' });

// Set DOM globals needed for React testing-library
// @ts-ignore
globalThis.window = happyWindow;
// @ts-ignore
globalThis.document = happyWindow.document;
// @ts-ignore
globalThis.HTMLElement = happyWindow.HTMLElement;
// @ts-ignore
globalThis.Element = happyWindow.Element;
// @ts-ignore
globalThis.Node = happyWindow.Node;
// @ts-ignore
globalThis.navigator = happyWindow.navigator;
// @ts-ignore
globalThis.MutationObserver = happyWindow.MutationObserver;
// @ts-ignore
globalThis.getComputedStyle = happyWindow.getComputedStyle.bind(happyWindow);

// Save native Event before potential happy-dom override
const NativeEvent = globalThis.Event;
const NativeCustomEvent = globalThis.CustomEvent;

// Mock IndexedDB for Node.js/Bun environment
import indexedDB from 'fake-indexeddb';
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';
import IDBRequest from 'fake-indexeddb/lib/FDBRequest';
import IDBObjectStore from 'fake-indexeddb/lib/FDBObjectStore';
import IDBIndex from 'fake-indexeddb/lib/FDBIndex';
import IDBTransaction from 'fake-indexeddb/lib/FDBTransaction';
import IDBCursor from 'fake-indexeddb/lib/FDBCursor';
import IDBDatabase from 'fake-indexeddb/lib/FDBDatabase';
import IDBFactory from 'fake-indexeddb/lib/FDBFactory';

// @ts-ignore - Polyfill IndexedDB for Bun runtime
globalThis.indexedDB = indexedDB;
// @ts-ignore
globalThis.IDBKeyRange = IDBKeyRange;
// @ts-ignore
globalThis.IDBRequest = IDBRequest;
// @ts-ignore
globalThis.IDBObjectStore = IDBObjectStore;
// @ts-ignore
globalThis.IDBIndex = IDBIndex;
// @ts-ignore
globalThis.IDBTransaction = IDBTransaction;
// @ts-ignore
globalThis.IDBCursor = IDBCursor;
// @ts-ignore
globalThis.IDBDatabase = IDBDatabase;
// @ts-ignore
globalThis.IDBFactory = IDBFactory;
