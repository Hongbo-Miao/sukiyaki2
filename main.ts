/// <reference path="./node_modules/milsushi2/index.d.ts"/>
import $M = require('milsushi2');
import Network = require('./network');
import OptimizerSGD = require('./optimizer_sgd');

function train_mnist() {
  var layers = [
    { name: "d_train", type: "mnist_data", params: { "data": "mnist/data_train.bin", "label": "mnist/label_train.bin" }, inputs: ["batch"], outputs: ["data", "label"], phase: ["train"] },
    { name: "d_test", type: "mnist_data", params: { "data": "mnist/data_test.bin", "label": "mnist/label_test.bin" }, inputs: ["batch"], outputs: ["data", "label"], phase: ["test"] },
    { name: "fc1", type: "linear", params: { in_size: 784, out_size: 100 }, inputs: ["data"], outputs: ["fc1"] },
    { name: "relu1", type: "relu", params: {}, inputs: ["fc1"], outputs: ["relu1"] },
    { name: "fc2", type: "linear", params: { in_size: 100, out_size: 10 }, inputs: ["relu1"], outputs: ["pred"] },
    { name: "l", type: "softmax_cross_entropy", params: {}, inputs: ["pred", "label"], outputs: ["loss"] },
    { name: "a", type: "accuracy", params: {}, inputs: ["pred", "label"], outputs: ["accuracy"], phase: ["test"] }
  ];

  var net = new Network(layers);
  net.init(() => {
    var opt = new OptimizerSGD(net, 1e-3);
    var batch_size = 100;

    var iter = 0;
    var max_iter = 10000;
    var next_iter = () => {
      if (iter % 10 == 0) {
        console.log("iteration " + iter);
      }
      net.phase = "train";
      var range_bottom = iter * batch_size + 1;
      var range_size = batch_size;
      var input_vars: { [index: string]: $M.Matrix } = { 'batch': $M.jsa2mat([range_bottom, range_size]) };
      opt.update(input_vars, () => {
        if (iter % 10 == 0) {
          console.log('loss: ' + net.blobs_forward['loss']);
        }
        if (iter < max_iter) {
          iter++;
          if (iter % 100 == 0) {
            validation();
          } else {
            next_iter();
          }
        } else {
          console.log("optimization finished");
          validation();
        }
      });

    };

    var validation = () => {
      console.log("validation at iteration " + iter);
      net.phase = "test";
      var input_vars: { [index: string]: $M.Matrix } = { 'batch': $M.jsa2mat([1, 100]) };
      net.forward(input_vars, () => {
        var acc = net.blobs_forward['accuracy'].get();
        console.log('accuracy ' + acc);
        if (iter < max_iter) {
          next_iter();
        }
      });
    };

    validation();

  });

  return net;
}

export = train_mnist;
