/**
 * @file tshark-parser.test.ts
 * Testes unitários para o parser de saída e buffer contínuo do TShark.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { TSharkOutputParser } from '../src/services/tsharkParser.js';

test('tshark-parser: processa pacotes divididos entre múltiplos chunks de stdout', () => {
  const parser = new TSharkOutputParser();

  // Linha completa: epoch \t len \t src \t dst \t tcp.reset \t tcp.syn \t subtype \t sa \t eth.src \n
  const chunk1 = '1700000000.123\t128\t192.168.1.50\t192.168.1.1\t';
  const chunk2 = '0\t1\t\t\tae:de:48:11:22:33\n1700000001.456\t';
  const chunk3 = '64\t192.168.1.20\t192.168.1.1\t1\t0\t\t\t00:11:22:33:44:55\n';

  // Chunk 1 não termina com newline, não emite nenhum pacote completo
  const packets1 = parser.pushChunk(chunk1);
  assert.equal(packets1.length, 0);

  // Chunk 2 completa a linha 1 e inicia a linha 2
  const packets2 = parser.pushChunk(chunk2);
  assert.equal(packets2.length, 1);
  assert.equal(packets2[0].frameLen, 128);
  assert.equal(packets2[0].ipSrc, '192.168.1.50');
  assert.equal(packets2[0].tcpFlagsSyn, true);
  assert.equal(packets2[0].tcpFlagsReset, false);
  assert.equal(packets2[0].ethSrc, 'ae:de:48:11:22:33');

  // Chunk 3 completa a linha 2
  const packets3 = parser.pushChunk(chunk3);
  assert.equal(packets3.length, 1);
  assert.equal(packets3[0].frameLen, 64);
  assert.equal(packets3[0].tcpFlagsReset, true);
  assert.equal(packets3[0].ethSrc, '00:11:22:33:44:55');
});

test('tshark-parser: ignora linhas corrompidas ou sem dados mínimos sem lançar exceção', () => {
  const parser = new TSharkOutputParser();

  const malformed = 'Capturing on wlan0\n\n\t\t\nINVALID_DATA\n';
  const packets = parser.pushChunk(malformed);
  assert.equal(packets.length, 0);
});

test('tshark-parser: extrai corretamente quadro 802.11 Deauth (subtype 12)', () => {
  const parser = new TSharkOutputParser();
  // Formato: epoch \t len \t src \t dst \t reset \t syn \t subtype \t wlan.sa \t eth.src
  const deauthLine = '1700000005.000\t44\t\t\t0\t0\t12\t00:aa:bb:cc:dd:ee\t\n';
  const packets = parser.pushChunk(deauthLine);

  assert.equal(packets.length, 1);
  assert.equal(packets[0].wlanTypeSubtype, 12);
  assert.equal(packets[0].wlanSa, '00:aa:bb:cc:dd:ee');
});
