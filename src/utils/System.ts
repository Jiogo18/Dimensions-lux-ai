/**
 * Various system related utilities
 */

import { spawnSync, spawn } from "child_process";

/**
 * Removes a file synchronously
 * @param file - file to remove
 */
export const removeFileSync = (file: string) => {
  spawnSync('rm', ['-f', file])
}

/**
 * Removes a file
 * @param file - file to remove
 */
export const removeFile = (file: string) => {
  return new Promise((resolve, reject) => {
    let p = spawn('rm', ['-f', file]);
    p.on('error', (err) => {
      reject(err);
    })
    p.on('close', (code) => {
      if (code === 0) {
        resolve();
      }
      else {
        reject('exited with code ' + code);
      }
    })
  })
}


/**
 * Removes files in the given directory synchronously
 * @param dir 
 */
export const removeDirectorySync = (dir: string) => {
  spawnSync('find', [dir, '-exec', 'rm', '-rf', '{}', '+']);
}

/**
 * Removes files in the given directory
 * @param dir
 */
export const removeDirectory = (dir: string) => {
  return new Promise((resolve, reject) => {
    let p = spawn('find', [dir, '-exec', 'rm', '-rf', '{}', '+']);
    p.on('error', (err) => {
      reject(err);
    })
    p.on('close', (code) => {
      if (code === 0) {
        resolve();
      }
      else {
        reject('exited with code ' + code);
      }
    })
  })
}