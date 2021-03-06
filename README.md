# Pulse Publisher

[![Build Status](https://travis-ci.org/taskcluster/pulse-publisher.svg?branch=master)](https://travis-ci.org/taskcluster/pulse-publisher)

A collection of utilities for interacting with Mozilla's [Pulse](https://pulseguardian.mozilla.org/).

## Requirements

This is tested on and should run on any of node `{0.12, 4, 6, 7}`.

## Usage
The source-code contain additional comments for each method.

```js
// Exchanges are typically declared in a file like exchanges.js
let Exchanges = require('pulse-publisher');

// Create a new set of exchanges
let exchanges = new Exchanges({
  title: 'Title for Exchanges Docs',
  description: [
    'Description in **markdown**.',
    'This will available in reference JSON',
  ].join(''),
  schemaPrefix: 'https://.../', // Prefix for all schema keys given in exchanges.declare
});

// Declare an exchange
exchanges.declare({
  exchange: 'test-exchange', // Name-suffix for exchange on RabbitMQ
  name:     'testExchange',  // Name of exchange in reference JSON (used client libraries)
  title:    'Title for Exchange Docs',
  description: [
    'Description in **markdown**.',
    'This will available in reference JSON',
  ].join(''),
  schema:   'name-of-my-schema.json',   // Schema for payload, prefix by schemaPrefix
  messageBuilder: (message) => message, // Build message from arguments given to publisher.testExchange(...)
  routingKey: [
    // Declaration of elements that makes up the routing key
    {
      // First element should always be constant 'primary' to be able to identify
      // primary routingkey from CC'ed routing keys.
      name: 'routingKeyKind', // Identifier used in client libraries
      summary: 'Routing key kind hardcoded to primary in primary routing-key',
      constant: 'primary',
      required: true,
    }, {
      name: 'someId', // See routingKeyBuilder
      summary: 'Breif docs',
      required: true || false, // If false, the default value is '_'
      maxSize: 22,    // Max size is validated when sending
      multipleWords: true || false, // If true, the value can contain dots '.'
    }, {
      // Last element should always be multiple words (and labeled reserved)
      // The only way to match it is with a #, hence, we ensure that clients are
      // compatible with future routing-keys if add addtional entries in the future.
      name:             'reserved',
      summary:          'Space reserved for future use.',
      multipleWords:    true,
      maxSize:          1,
    }
  ],
  routingKeyBuilder: (message) => {
    // Build routingKey from arguments given to publisher.testExchange(...)
    // This can return either a string or an object with a key for each
    // required property specified in 'routingKey' above.
    return {
      someId: message.someIdentifier,
    };
  },
  CCBuilder: (message) => {
    // Construct CC'ed routingkeys as strings from arguments given to publisher.testExchanges(...)
    // By convention they should all be prefixed 'route.', so they don't interfer with the primary
    // routing key.
    return message.routes.map(r => 'route.' + r);
  },
});

// Note you can declare multiple exchanges, by calling exchanges.declare again.
// Nothing happens on AMQP before exchanges.connect() is called. This just declares
// the code in JS.

// Some where in your app, instantiate a publisher
let publisher = await exchanges.connect({
  credentials: {username: '...', password: '...'},
  exchangePrefix: 'v1/', // Prefix for all exchanges (in addition to exchanges/<username>/)
  validator: await require('taskcluster-lib-validate')(), // instance of taskcluster-lib-validate
  monitor: undefined, // optional instance of taskcluster-lib-monitor
});

// Send a message to the declared testExchange
await publisher.testExchange({someIdentifier: '...', routes: [], ...});

// Docs can also be generated with exchange.reference(), see source code docs for details.
```

## Testing
You'll need to fill a file called `user-config.yml` with valid keys. There is a `user-config-exaemple.yml` you can copy over to see which keys are needed. Then it is just a matter of `yarn install` and `yarn test`.

## License
[Mozilla Public License Version 2.0](https://github.com/taskcluster/pulse-publisher/blob/master/LICENSE)
