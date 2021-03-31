function legend({
    color,
    title,
    tickSize = 6,
    width = 320, 
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues
  } = {}) {
  
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");
  
    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;
  
    // Continuous
    if (color.interpolate) {
      const n = Math.min(color.domain().length, color.range().length);
  
      x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));
  
      svg.append("image")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }
  
    // Sequential
    else if (color.interpolator) {
      x = Object.assign(color.copy()
          .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
          {range() { return [marginLeft, width - marginRight]; }});
  
      svg.append("image")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", ramp(color.interpolator()).toDataURL());
  
      // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
      if (!x.ticks) {
        if (tickValues === undefined) {
          const n = Math.round(ticks + 1);
          tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
        }
        if (typeof tickFormat !== "function") {
          tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
        }
      }
    }
  
    // Threshold
    else if (color.invertExtent) {
      const thresholds
          = color.thresholds ? color.thresholds() // scaleQuantize
          : color.quantiles ? color.quantiles() // scaleQuantile
          : color.domain(); // scaleThreshold
  
      const thresholdFormat
          = tickFormat === undefined ? d => d
          : typeof tickFormat === "string" ? d3.format(tickFormat)
          : tickFormat;
  
      x = d3.scaleLinear()
          .domain([-1, color.range().length - 1])
          .rangeRound([marginLeft, width - marginRight]);
  
      svg.append("g")
        .selectAll("rect")
        .data(color.range())
        .join("rect")
          .attr("x", (d, i) => x(i - 1))
          .attr("y", marginTop)
          .attr("width", (d, i) => x(i) - x(i - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", d => d);
  
      tickValues = d3.range(thresholds.length);
      tickFormat = i => thresholdFormat(thresholds[i], i);
    }
  
    // Ordinal
    else {
      x = d3.scaleBand()
          .domain(color.domain())
          .rangeRound([marginLeft, width - marginRight]);
  
      svg.append("g")
        .selectAll("rect")
        .data(color.domain())
        .join("rect")
          .attr("x", x)
          .attr("y", marginTop)
          .attr("width", Math.max(0, x.bandwidth() - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", color);
  
      tickAdjust = () => {};
    }
  
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
          .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
          .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
          .tickSize(tickSize)
          .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
          .attr("x", marginLeft)
          .attr("y", marginTop + marginBottom - height - 6)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .attr("class", "title")
          .text(title));
  
    return svg.node();
  }

  function swatches({
    color,
    columns = null,
    format = x => x,
    swatchSize = 15,
    swatchWidth = swatchSize,
    swatchHeight = swatchSize,
    marginLeft = 0
  }) {
    const id = DOM.uid().id;
  
    if (columns !== null) return html`<div style="display: flex; align-items: center; margin-left: ${+marginLeft}px; min-height: 33px; font: 10px sans-serif;">
    <style>
  
  .${id}-item {
    break-inside: avoid;
    display: flex;
    align-items: center;
    padding-bottom: 1px;
  }
  
  .${id}-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - ${+swatchWidth}px - 0.5em);
  }
  
  .${id}-swatch {
    width: ${+swatchWidth}px;
    height: ${+swatchHeight}px;
    margin: 0 0.5em 0 0;
  }
  
    </style>
    <div style="width: 100%; columns: ${columns};">${color.domain().map(value => {
      const label = format(value);
      return html`<div class="${id}-item">
        <div class="${id}-swatch" style="background:${color(value)};"></div>
        <div class="${id}-label" title="${label.replace(/["&]/g, entity)}">${document.createTextNode(label)}</div>
      </div>`;
    })}
    </div>
  </div>`;
  
    return html`<div style="display: flex; align-items: center; min-height: 33px; margin-left: ${+marginLeft}px; font: 10px sans-serif;">
    <style>
  
  .${id} {
    display: inline-flex;
    align-items: center;
    margin-right: 1em;
  }
  
  .${id}::before {
    content: "";
    width: ${+swatchWidth}px;
    height: ${+swatchHeight}px;
    margin-right: 0.5em;
    background: var(--color);
  }
  
    </style>
    <div>${color.domain().map(value => html`<span class="${id}" style="--color: ${color(value)}">${document.createTextNode(format(value))}</span>`)}</div>`;
  }

  function entity(character) {
    return `&#${character.charCodeAt(0).toString()};`;
  }

  function ramp(color, n = 256) {
    const canvas = DOM.canvas(n, 1);
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }


    DOM = {};
    DOM.canvas = function (width, height) {
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }

    var count = 0;
    DOM.uid = function(name) {
      return new Id("O-" + (name == null ? "" : name + "-") + ++count);
    }
      
    function Id(id) {
      this.id = id;
      this.href = new URL(`#${id}`, location) + "";
    }
      
    Id.prototype.toString = function() {
      return "url(" + this.href + ")";
    };

    function template(render, wrapper) {
      return function(strings) {
        var string = strings[0],
            parts = [], part,
            root = null,
            node, nodes,
            walker,
            i, n, j, m, k = -1;
    
        // Concatenate the text using comments as placeholders.
        for (i = 1, n = arguments.length; i < n; ++i) {
          part = arguments[i];
          if (part instanceof Node) {
            parts[++k] = part;
            string += "<!--o:" + k + "-->";
          } else if (Array.isArray(part)) {
            for (j = 0, m = part.length; j < m; ++j) {
              node = part[j];
              if (node instanceof Node) {
                if (root === null) {
                  parts[++k] = root = document.createDocumentFragment();
                  string += "<!--o:" + k + "-->";
                }
                root.appendChild(node);
              } else {
                root = null;
                string += node;
              }
            }
            root = null;
          } else {
            string += part;
          }
          string += strings[i];
        }
    
        // Render the text.
        root = render(string);
    
        // Walk the rendered content to replace comment placeholders.
        if (++k > 0) {
          nodes = new Array(k);
          walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null, false);
          while (walker.nextNode()) {
            node = walker.currentNode;
            if (/^o:/.test(node.nodeValue)) {
              nodes[+node.nodeValue.slice(2)] = node;
            }
          }
          for (i = 0; i < k; ++i) {
            if (node = nodes[i]) {
              node.parentNode.replaceChild(parts[i], node);
            }
          }
        }
    
        // Is the rendered content
        // … a parent of a single child? Detach and return the child.
        // … a document fragment? Replace the fragment with an element.
        // … some other node? Return it.
        return root.childNodes.length === 1 ? root.removeChild(root.firstChild)
            : root.nodeType === 11 ? ((node = wrapper()).appendChild(root), node)
            : root;
      };
    }

    html =template(function(string) {
      var template = document.createElement("template");
      template.innerHTML = string.trim();
      return document.importNode(template.content, true);
    }, function() {
      return document.createElement("span");
    });
 
