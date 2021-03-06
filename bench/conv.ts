import $M = require('milsushi2');
import Sukiyaki = require('../index');
import BenchBase = require('./bench_base');

class conv extends BenchBase {
  layer: Sukiyaki.Layers.Convolution2DLayer;

  constructor(public params: {in_size: number, out_size: number, ksize: number, stride: number, pad: number}, public image_shape: number[]) {
    super();
    this.name = 'conv ' + JSON.stringify(params) + ' with input ' + JSON.stringify(image_shape);
  }

  setup() {
    this.layer = new Sukiyaki.Layers.Convolution2DLayer(this.params);
    var input_image = $M.rand(...this.image_shape);
    return [input_image];
  }

  run(callback: any, input_image: $M.Matrix): void {
    var config = new Sukiyaki.ForwardConfiguration();
    config.devicetype = 'cpu';
    config.phase = 'train';
    this.layer['delta_weight'] = $M.zeros($M.size(this.layer['weight']));
    this.layer['delta_bias'] = $M.zeros($M.size(this.layer['bias']));
    this.layer.forward([input_image], config, (tops: $M.Matrix[]) => {
      // use top as top gradient
      var top_delta = tops[0];
      this.layer.calculateUpdateParams([input_image], [top_delta], config, () => {
        this.layer.backward([input_image], [top_delta], config, (bottom_deltas: $M.Matrix[]) => {
          callback();
        })
      });
    });
  }
}

export = conv;
