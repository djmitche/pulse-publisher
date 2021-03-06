suite("Exchanges", function() {
  var assert  = require('assert');
  var subject = require('../');
  var config  = require('typed-env-config');
  var aws     = require('aws-sdk');

  test("publish", function() {
    var cfg = config({});

    if (!cfg.aws.secretAccessKey || !cfg.testBucket) {
      throw new Error("Skipping 'publish', missing config file: " +
                      "user-config.yml");
    }

    // Create an exchanges
    var exchanges = new subject({
      title:              "Title for my Events",
      description:        "Test exchanges used for testing things only"
    });
    // Check that we can declare an exchange
    exchanges.declare({
      exchange:           'test-exchange',
      name:               'testExchange',
      title:              "Test Exchange",
      description:        "Place we post message for **testing**.",
      routingKey: [
        {
          name:           'testId',
          summary:        "Identifier that we use for testing",
          multipleWords:  false,
          required:       true,
          maxSize:        22
        }, {
          name:           'taskRoutingKey',
          summary:        "Test specific routing-key: `test.key`",
          multipleWords:  true,
          required:       true,
          maxSize:        128
        }, {
          name:           'state',
          summary:        "State of something",
          multipleWords:  false,
          required:       false,
          maxSize:        16
        }
      ],
      schema: 'http://schemas.taskcluster.net/base/tests/exchanges-test.json',
      messageBuilder:     function(test) { return test; },
      routingKeyBuilder:  function(test, state) {
        return {
          testId:           test.id,
          taskRoutingKey:   test.key,
          state:            state
        }
      },
      CCBuilder:          function() { return []; }
    });

    // Publish
    return exchanges.publish({
      referencePrefix:      'base/test/exchanges.json',
      referenceBucket:      cfg.testBucket,
      aws:                  cfg.aws
    }).then(function() {
      // Get the file... we don't bother checking the contents this is good
      // enough
      var s3 = new aws.S3(cfg.aws);
      return s3.getObject({
        Bucket:     cfg.testBucket,
        Key:        'base/test/exchanges.json'
      }).promise();
    }).then(function(res) {
      var reference = JSON.parse(res.Body);
      assert(reference.entries, "Missing entries");
      assert(reference.entries.length > 0, "Has no entries");
      assert(reference.title, "Missing title");
    });
  });
});
