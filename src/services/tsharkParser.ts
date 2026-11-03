/**
 * @file tsharkParser.ts
 * Parser com buffer contínuo de linhas para saída de campos do TShark.
 */

import { RawPacketData } from '../domain/metrics.js';

export class TSharkOutputParser {
  private buffer = '';

  /**
   * Processa um chunk arbitrário de stdout e extrai todas as linhas completas.
   */
  public pushChunk(chunk: string | Buffer): RawPacketData[] {
    this.buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const packets: RawPacketData[] = [];

    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.length > 0) {
        const parsed = this.parseLine(line);
        if (parsed) {
          packets.push(parsed);
        }
      }
    }

    return packets;
  }

  /**
   * Converte uma linha tabulada (TSV) do TShark nos campos tipados.
   * Campos esperados:
   * 0: frame.time_epoch
   * 1: frame.len
   * 2: ip.src
   * 3: ip.dst
   * 4: tcp.flags.reset
   * 5: tcp.flags.syn
   * 6: wlan.fc.type_subtype
   * 7: wlan.sa
   * 8: eth.src
   */
  public parseLine(line: string): RawPacketData | null {
    // TShark com -T fields separa por tabulação (\t) por padrão
    const fields = line.split('\t');
    if (fields.length < 2) {
      return null;
    }

    const epochStr = fields[0]?.trim();
    const frameLenStr = fields[1]?.trim();

    const timestampSec = Number(epochStr);
    const frameLen = Number(frameLenStr);

    if (isNaN(frameLen) || frameLen <= 0) {
      return null;
    }

    const timestamp = isNaN(timestampSec) || timestampSec <= 0 ? Date.now() : Math.round(timestampSec * 1000);

    const ipSrc = fields[2]?.trim() || undefined;
    const ipDst = fields[3]?.trim() || undefined;

    const tcpFlagsReset = fields[4]?.trim() === '1' || fields[4]?.trim() === 'true';
    const tcpFlagsSyn = fields[5]?.trim() === '1' || fields[5]?.trim() === 'true';

    const subtypeVal = fields[6]?.trim();
    const wlanTypeSubtype = subtypeVal && !isNaN(Number(subtypeVal)) ? Number(subtypeVal) : undefined;

    const wlanSa = fields[7]?.trim() || undefined;
    const ethSrc = fields[8]?.trim() || undefined;

    return {
      timestamp,
      frameLen,
      ipSrc,
      ipDst,
      tcpFlagsReset,
      tcpFlagsSyn,
      wlanTypeSubtype,
      wlanSa,
      ethSrc,
    };
  }

  public clear(): void {
    this.buffer = '';
  }
}
