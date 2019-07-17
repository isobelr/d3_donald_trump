/**
 * scrollVis - encapsulates
 * all the code for the visualisation
 */
var scrollVis = function () {
    // Defining the the size and margins of the vis area.
    var width = 600;
    var height = 520;
    var margin = {
        top: 0,
        left: 20,
        bottom: 40,
        right: 10
    };

    // Keep track of which visualization user is on and which was the last
    // index activated. When user scrolls quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;

    // Sizing parameters for the grid
    var squareSize = 6;
    var squarePad = 2;
    var numPerRow = width / (squareSize + squarePad);

    // Main svg used for visualisations
    var svg = null;

    // d3 selection that will be used for displaying visualisations
    var g = null;

    // We will set the domain when the data is processed.
    var xBarScale = d3.scaleLinear()
        .range([0, width]);

    // The bar chart display is horizontal so we can use an ordinal scale to get width and y locations.
    var yBarScale = d3.scaleBand()
        .paddingInner(0.08)
        .domain([0, 1, 2])
        .range([0, height - 50], 0.1, 0.1);

    // Color is determined by the index of the bars
    var barColors = {
        0: '#8CC051',
        1: '#DB4455',
        2: '#AAB2BD'
    };

    // Axis for bar chart
    var xAxisBar = d3.axisBottom()
        .scale(xBarScale);

    // When scrolling to a new section the activation function for that section is called.
    var activateFunctions = [];
    // If a section has an update function then it is called while scrolling
    // through the section with the current progress through the section.
    var updateFunctions = [];





    /**
     * chart
     *
     */
    var chart = function (selection) {
        selection.each(function (rawData) {
            
            // Create svg and give it a width and height
            svg = d3.select(this).selectAll('svg').data([posData]);
            var svgE = svg.enter().append('svg');
            
            // Use merge to combine enter and existing selection
            svg = svg.merge(svgE);

            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            svg.append('g');

            // This group element will be used to contain all other elements.
            g = svg.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Perform some preprocessing on raw data by calling on data functions
            // Positive data
            var posData = getPositive(rawData);
            
            // Get the negative tweet data
            var negData = getNegative(rawData);
            
            // get the counts of sentiment for the bar chart display
            var sentimentValue = getSentimentValue(posData);
            var sentimentCounts = groupBySentiment(sentimentValue);
            
            // set the bar scale's domain
            var countMax = d3.max(sentimentCounts, function (d) {
                return d.value;
            });
            
            xBarScale.domain([0, countMax]);

            setupVis(posData, negData, sentimentCounts);

            setupSections();
        });
    };





    /**
     * setupVis - creates initial elements for all sections of the visualisation.
     */
    var setupVis = function (posData, negData, sentimentCounts) {
        
        // Axis
        g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxisBar);
        g.select('.x.axis').style('opacity', 0);
        
        
        // Tweet count opener
        g.append('text')
            .attr('class', 'title count-title highlight')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .text('5,632');

        g.append('text')
            .attr('class', 'sub-title count-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 5))
            .text('Tweets');

        g.selectAll('.count-title')
            .attr('opacity', 0);

        
        // Square grid with positives
        var squares = g.selectAll('.square').data(posData, function (d) {
            return d.id;
        });
        var squaresE = squares.enter()
            .append('rect')
            .classed('square', true);
        squares = squares.merge(squaresE)
            .attr('width', squareSize)
            .attr('height', squareSize)
            .attr('fill', '#fff')
            .classed('fill-square', function (d) {
                return d.positive;
            })
            .attr('x', function (d) {
                return d.x;
            })
            .attr('y', function (d) {
                return d.y;
            })
            .attr('opacity', 0);


        // Square grid with negatives - the same as above
        var squares2 = g.selectAll('.square2').data(negData, function (d) {
            return d.id;
        });
        var squaresE2 = squares2.enter()
            .append('rect')
            .classed('square2', true);
        squares = squares2.merge(squaresE2)
            .attr('width', squareSize)
            .attr('height', squareSize)
            .attr('fill', '#fff')
            .classed('fill-square2', function (d) {
                return d.negative;
            })
            .attr('x', function (d) {
                return d.x;
            })
            .attr('y', function (d) {
                return d.y;
            })
            .attr('opacity', 0);


        // Barchart
        var bars = g.selectAll('.bar').data(sentimentCounts);
        var barsE = bars.enter()
            .append('rect')
            .attr('class', 'bar');
        bars = bars.merge(barsE)
            .attr('x', 0)
            .attr('y', function (d, i) {
                return yBarScale(i);
            })
            .attr('fill', function (d, i) {
                return barColors[i];
            })
            .attr('width', 0)
            .attr('height', yBarScale.bandwidth());
        var barText = g.selectAll('.bar-text').data(sentimentCounts);
        barText.enter()
            .append('text')
            .attr('class', 'bar-text')
            .text(function (d) {
                return d.key + '…';
            })
            .attr('x', 0)
            .attr('dx', 15)
            .attr('y', function (d, i) {
                return yBarScale(i);
            })
            .attr('dy', yBarScale.bandwidth() / 1.2)
            .style('font-size', '35px')
            .attr('fill', 'white')
            .attr('opacity', 0);
    };
    
    
    
    

    /**
     * setupSections - each section is activated by a separate function. Here we associate
     * these functions to the sections based on the section's index.
     */
    var setupSections = function () {
        activateFunctions[0] = showTitle;
        activateFunctions[1] = showCountTitle;
        activateFunctions[2] = showGrid;
        activateFunctions[3] = highlightPos;
        activateFunctions[4] = highlightNeg;
        activateFunctions[5] = showBar;
        activateFunctions[6] = hideBar


        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 7; i++) {
            updateFunctions[i] = function () {};
        }
    };

    /**
     * ACTIVATE FUNCTIONS
     *
     * These will be called as the user scrolls to their section.
     *
     * The pattern is to ensure all content for the current section
     * is transitioned in, while hiding the content for both the previous section
     * and the next section (as the user may be scrolling up or down).
     *
     */

    /**
     * Introduction
     *
     * hides: tweet count title
     * shows: nothing! used to add a gap for the intro section
     *
     */
    function showTitle() {
        g.selectAll('.count-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.nothing')
            .transition()
            .duration(500)
            .attr('opacity', 1.0);
    }

    /**
     * showCountTitle - tweet counts
     *
     * hides: square grid
     * shows: tweet count title
     *
     */
    function showCountTitle() {
        g.selectAll('.square')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.count-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);
    }

    /**
     * showGrid - square grid
     *
     * hides: tweet count title
     * hides: positive highlight in grid
     * shows: square grid
     *
     */
    function showGrid() {
        g.selectAll('.count-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.square')
            .transition()
            .duration(600)
            .delay(function (d) {
                return 5 * d.row;
            })
            .attr('opacity', 1.0)
            .attr('fill', '#ddd');
    }

    /**
     * highlightPos - show positives in grid
     *
     * hides: barchart, text and axis
     * shows: square grid and highlighted positives.
     */
    function highlightPos() {
        hideAxis();
        
        g.selectAll('.square2')
            .transition()
            .duration(800)
            .attr('opacity', 0);

        g.selectAll('.fill-square2')
            .transition()
            .duration(800)
            .attr('x', 0)
            .attr('y', function (d, i) {
                return yBarScale(i % 3) + yBarScale.bandwidth() / 2;
            })
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.square')
            .transition()
            .duration(0)
            .attr('opacity', 1.0)
            .attr('fill', '#ddd');

        g.selectAll('.fill-square')
            .transition('move-fills')
            .duration(800)
            .attr('x', function (d) {
                return d.x;
            })
            .attr('y', function (d) {
                return d.y;
            });

        g.selectAll('.fill-square')
            .transition()
            .duration(800)
            .attr('opacity', 1.0)
            .attr('fill', function (d) {
                return d.positive ? '#8CC051' : '#ddd';
            });
    }


    /**
     * highlightNeg NEGATIVE - show negatives in grid
     *
     * hides: barchart, text and axis
     * shows: square grid and highlighted negatives. 
     */
    function highlightNeg() {
        hideAxis();
        
        g.selectAll('.square')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        g.selectAll('.fill-square')
            .transition()
            .duration(600)
            .attr('x', 0)
            .attr('y', function (d, i) {
                return yBarScale(i % 3) + yBarScale.bandwidth() / 2;
            })
            .transition()
            .duration(800)
            .attr('opacity', 0);
        
        g.selectAll('.bar')
            .transition()
            .duration(600)
            .attr('width', 0);

        g.selectAll('.bar-text')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.square2')
            .transition()
            .duration(0)
            .attr('opacity', 1.0)
            .attr('fill', '#ddd');

        g.selectAll('.fill-square2')
            .transition('move-fills')
            .duration(500)
            .attr('x', function (d) {
                return d.x;
            })
            .attr('y', function (d) {
                return d.y;
            });

        g.selectAll('.fill-square2')
            .transition()
            .duration(500)
            .attr('opacity', 1.0)
            .attr('fill', function (d) {
                return d.negative ? '#DB4455' : '#ddd';
            });
    }
    

    /**
     * showBar - barchart
     *
     * hides: square grid
     * shows: barchart
     *
     */
    function showBar() {
        // ensure bar axis is set
        showAxis(xAxisBar);

        g.selectAll('.square2')
            .transition()
            .duration(800)
            .attr('opacity', 0);

        g.selectAll('.fill-square2')
            .transition()
            .duration(800)
            .attr('x', 0)
            .attr('y', function (d, i) {
                return yBarScale(i % 3) + yBarScale.bandwidth() / 2;
            })
            .transition()
            .duration(0)
            .attr('opacity', 0);


        g.selectAll('.bar')
            .transition()
            .delay(function (d, i) {
                return 300 * (i + 1);
            })
            .duration(500)
            .attr('width', function (d) {
                return xBarScale(d.value);
            });

        g.selectAll('.bar-text')
            .transition()
            .duration(500)
            .delay(1200)
            .attr('opacity', 1);
    }

    
    /**
     * hide bar - used to finish up the visualisation and make room for outro.
     */
    function hideBar() {
        hideAxis();
        g.selectAll('.bar')
            .transition()
            .duration(600)
            .attr('width', 0);

        g.selectAll('.bar-text')
            .transition()
            .duration(0)
            .attr('opacity', 0); 
    }
    
    
    /**
     * showAxis - helper function to
     * display particular xAxis
     */
    function showAxis(axis) {
        g.select('.x.axis')
            .call(axis)
            .transition().duration(500)
            .style('opacity', 1);
    }

    /**
     * hideAxis - helper function
     * to hide the axis
     */
    function hideAxis() {
        g.select('.x.axis')
            .transition().duration(500)
            .style('opacity', 0);
    }






    /**
     * DATA FUNCTIONS
     * Used to coerce the data into the formats needed for visualisation.
     */

    /** 
     * This function converts some attributes into numbers for the visualisations.
     */
    function getPositive(rawData) {
        return rawData.map(function (d, i) {
            // is this positive?
            d.positive = (d.positive === '1') ? true : false;
            // positioning for square visual stored here to make it easier to keep track of.
            d.col = i % numPerRow;
            d.x = d.col * (squareSize + squarePad);
            d.row = Math.floor(i / numPerRow);
            d.y = d.row * (squareSize + squarePad);
            return d;
        });
    }

    /**
     * Same as above but for negative tweets.
     */
    function getNegative(rawData) {
        return rawData.map(function (d, i) {
            d.negative = (d.negative === '1') ? true : false;
            d.col = i % numPerRow;
            d.x = d.col * (squareSize + squarePad);
            d.row = Math.floor(i / numPerRow);
            d.y = d.row * (squareSize + squarePad);
            return d;
        });
    }


    /**
     * Returns array of only sentiments.
     */
    function getSentimentValue(data) {
        return data.filter(function (d) {
            return d.sentiment;
        });
    }

    /**
     * Group inputs together based on sentiment using nest. Used to get counts for the barchart.
     */
    function groupBySentiment(sentiment) {
        return d3.nest()
            .key(function (d) {
                return d.sentiment;
            })
            .rollup(function (v) {
                return v.length;
            })
            .entries(sentiment)
            .sort(function (a, b) {
                return b.value - a.value;
            });
    }





    /**
     * Activate the chart. Taken from JV.
     */
    chart.activate = function (index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    /**
     * Update
     */
    chart.update = function (index, progress) {
        updateFunctions[index](progress);
    };

    // Return chart function
    return chart;
};

/**
 * display - called once data has been loaded. sets up the scroller and displays the visualisation.
 */
function display(data) {
    // create a new plot and display it
    var plot = scrollVis();
    d3.select('#vis')
        .datum(data)
        .call(plot);

    // setup scroll functionality
    var scroll = scroller()
        .container(d3.select('#graphic'));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) {
                return i === index ? 1 : 0.1;
            });

        // activate current section
        plot.activate(index);
    });

    scroll.on('progress', function (index, progress) {
        plot.update(index, progress);
    });
}


// Load in data file 
d3.csv('DT_D3_Sentiment.csv', display);
