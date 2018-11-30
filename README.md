![Mailsploit logo](https://raw.githubusercontent.com/pwnsdx/Mailsploit/master/resources/logo.png?fuckgithubcache=2)

### Mailsploit Server

#### How to install

1. Clone the repository
2. Edit `originalFrom` in `src/main/Config.ts` with your email address.
3. Run the following commands in the terminal:
```
yarn install && yarn dist # Require yarn
```

#### How to launch the web server

1. Run the following commands in the terminal:
```
# First configure the environment
export MAILSPLOIT_HOST=[SMTP Server Hostname]
export MAILSPLOIT_PORT=[SMTP Server Port (default 465)]
export MAILSPLOIT_USERNAME=[SMTP Server Username]
export MAILSPLOIT_PASSWORD=[SMTP Server Password]
export MAILSPLOIT_IGNORE_TLS=[Boolean - Ignore self signed certificates]
npm run build && npm start
```
2. That's it. The server will run on localhost:8081

#### How to use it

You can do a POST request containing `sender`, `receiver` and `options` (from 0 to 13) parameters to the `/process` endpoint.

Example using cURL (payload 3 without XSS):

```
curl --url http://localhost:8081/process --data "sender=potus@whitehouse.gov&receiver=sabri@riseup.net&options=2"
```

or, all the payloads with XSS:

```
curl --url http://localhost:8081/process --data "sender=potus@whitehouse.gov&receiver=sabri@riseup.net&xss=true&options=-1"
```

All the payloads are [available here](https://github.com/pwnsdx/Mailsploit/blob/master/src/main/Payloads.ts#L30).
