// Native lesson, transaction, practice and reduced-motion gates for all dashes.
import {DASH_STUDY_IDS} from '../src/dash-study.js';
process.env.QA_STUDY_IDS=DASH_STUDY_IDS.join(',');
process.env.QA_PRACTICE='1';
process.env.QA_OUT_DIR||='.arena/harmony-chunk17/browser';
await import('./shop-ability-browser-qa.mjs');
