/*
 * Mailsploit Server
 * Copyright (C) 2018 Sabri Haddouche
 */

import * as express from 'express';
import * as bodyParser from 'body-parser';
import {Dispatcher} from '../Dispatcher';

const dispatcher = new Dispatcher();

const router: express.Router = express.Router();
const handler: express.Handler = async (req, res): Promise<express.Response> => {
  if (!req.body) {
    return res.status(500).send({error: 'Content is missing.'});
  }

  if (
    typeof req.body.receiver === 'string' &&
    typeof req.body.sender === 'string' &&
    typeof req.body.options === 'string'
  ) {
    try {
      await dispatcher.dispatch(req.body.receiver, req.body.sender, req.body.options, req.body.xss);
    } catch (error) {
      // log this error
      console.log(error);
      return res.status(500).send({error: 'An error occurred while sending the email. Please try again later.'});
    }
    return res.status(200).send();
  }

  return res.status(500).send({error: 'Unknown error happened.'});
};

router.post('/', bodyParser.urlencoded({extended: false}), handler);

export = router;
