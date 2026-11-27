// Extends the native store gates to the thirteen precision/instrument lessons.
import {AIM_STUDY_IDS} from '../src/aim-study.js';
process.env.QA_STUDY_IDS=AIM_STUDY_IDS.join(',');
process.env.QA_PRACTICE='1';
process.env.QA_WALLET||='10000';
process.env.QA_OUT_DIR||='.arena/harmony-chunk16/browser';
await import('./shop-ability-browser-qa.mjs');
