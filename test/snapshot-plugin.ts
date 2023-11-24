module.exports = {
  print(val: any, serialize: any) {
    const remoteOutputsResource = val;
    remoteOutputsResource.Properties.randomString = '<RANDOM STRING>';
    return serialize(remoteOutputsResource);
  },

  test(val: any) {
    return (
      val &&
      val.Type &&
      val.Type === 'AWS::CloudFormation::CustomResource' &&
      val?.Properties?.randomString &&
      val.Properties.randomString !== '<RANDOM STRING>'
    );
  },
};
