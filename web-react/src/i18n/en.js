/**
 * Diccionario español → inglés. Cada módulo de `./en/` aporta sus claves.
 * Se mantiene en trozos para que sea fácil de revisar.
 */
import ui from './en/ui.js';
import explorer from './en/explorer.js';
import pages from './en/pages.js';
import sim from './en/sim.js';
import data from './en/data.js';

export default Object.freeze({ ...ui, ...explorer, ...pages, ...sim, ...data });
