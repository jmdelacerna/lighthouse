/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');

const makeDevtoolsLog =
  require('lighthouse/lighthouse-core/test/network-records-to-devtools-log.js');
const ModuleDuplication = require('lighthouse/lighthouse-core/computed/module-duplication.js');
const DuplicatedJavascript =
  require('lighthouse/lighthouse-core/audits/byte-efficiency/duplicated-javascript.js');
const LegacyJavascript = require('lighthouse/lighthouse-core/audits/legacy-javascript.js');

/**
 * @param {Array<{url: string, content: string, map: any}>} scriptDatas
 */
function createGathererData(scriptDatas) {
  const SourceMaps = scriptDatas.map(data => {
    return {
      scriptUrl: data.url,
      map: data.map,
    };
  });
  const ScriptElements = scriptDatas.map((data, i) => {
    return {
      requestId: `1000.${i}`,
      src: data.url,
      content: data.content,
    };
  });
  const networkRecords = scriptDatas.map((data, i) => {
    return {
      requestId: `1000.${i}`,
      url: data.url,
      content: data.content,
    };
  });
  networkRecords.push({url: 'https://www.example.com', resourceType: 'Document'});

  const artifacts = {
    URL: {finalUrl: 'https://www.example.com'},
    devtoolsLogs: {defaultPass: makeDevtoolsLog(networkRecords)},
    SourceMaps,
    ScriptElements,
  };

  return {
    artifacts,
    networkRecords,
  };
}

async function run() {
  /* eslint-disable max-len */
  const FOO_JS_1 = fs.readFileSync(require.resolve('lighthouse/lighthouse-core/test/fixtures/source-maps/coursehero-bundle-1.js'), 'utf-8');
  const FOO_JS_MAP_1 = JSON.parse(fs.readFileSync(require.resolve('lighthouse/lighthouse-core/test/fixtures/source-maps/coursehero-bundle-1.js.map'), 'utf-8'));
  const FOO_JS_2 = fs.readFileSync(require.resolve('lighthouse/lighthouse-core/test/fixtures/source-maps/coursehero-bundle-2.js'), 'utf-8');
  const FOO_JS_MAP_2 = JSON.parse(fs.readFileSync(require.resolve('lighthouse/lighthouse-core/test/fixtures/source-maps/coursehero-bundle-2.js.map'), 'utf-8'));
  /* eslint-enable max-len */

  const context = {computedCache: new Map()};
  const {artifacts, networkRecords} = createGathererData([
    {url: 'https://www.example.com/foo1.js', content: FOO_JS_1, map: FOO_JS_MAP_1},
    {url: 'https://www.example.com/foo2.js', content: FOO_JS_2, map: FOO_JS_MAP_2},
  ]);

  // Request a computed artifact directly.
  const duplication = await ModuleDuplication.request(artifacts, context);

  // Run an audit directly.
  const legacyJavascriptResult = await LegacyJavascript.audit(artifacts, context);

  // Run a byte-efficiency audit directly.
  const duplicatedJavascriptResult =
    await DuplicatedJavascript.audit_(artifacts, networkRecords, context);

  // eslint-disable-next-line no-console
  console.log({duplication, legacyJavascriptResult, duplicatedJavascriptResult});
}

run();
