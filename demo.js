

const canvasDOM = document.getElementById('canvas'),
      width = canvasDOM.offsetWidth,
      height = canvasDOM.offsetHeight,
      fluid = new Fluid(canvasDOM, width, height),
      vector = Fluid.vector;


fluid.addPlane(vector(0, height), vector(width, height));
