
'use strict';

import * as util from 'util';

import db from './database' ;
import utils from './utils' ;

const DEFAULT_BATCH_SIZE: number = 100;
import { promisify } from 'util';
const sleep = promisify(setTimeout);