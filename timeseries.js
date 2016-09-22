/* 
 * assume data input of the form 
 * 
 * Date\tcolumn_header_1\tcolumn_header_2\t... \n
 * %Y%m%d\tval1\tval2, 		...				   \n
 * 
 * column headers are used for timeseries line ids with spaces and slashes removed			
 */

var update_date;

function load_timeseries(ts_input_file, ts_id, ts_type, colors, params, target_container, comm_msg)
{
	var target_container = typeof target_container !== 'undefined' ? target_container : "body";
	
	var special;
	if(params.hasOwnProperty("special"))
		special = params["special"];
	else
		special = false;
	
	var time_idx;
	if(params.hasOwnProperty('time_idx'))
		time_idx = params.time_idx;
	else
		time_idx = false;
	
	var width_param;
	if(params.hasOwnProperty('width'))
		width_param = params.width;
	else
		width_param = 1100;
	
	var height_param;
	if(params.hasOwnProperty('height'))
		height_param = params.height;
	else
		height_param = 500;
	
	var margin_param;
	if(params.hasOwnProperty('margin'))
		margin_param = params.margin;
	else
		margin_param = {top: 20, right: 350, bottom: 100, left: 50};
	
	var margin2_param;
	if(params.hasOwnProperty('margin2'))
		margin2_param = params.margin2;
	else
		margin2_param = { top: 430, right: 150, bottom: 20, left: 40 };
	
	
	// set local map time if provided
	var time = 0;
	if(time_idx)
		time = time_idx;
	else
	{
		// check if global_time_idx is defined by comms.js (e.g. comms.js was imported)
		if(typeof global_time_index !== 'undefined')
			time = global_time_idx;			
	}
	
	var margin = margin_param,
    margin2 = margin2_param,
    width = width_param - margin.left - margin.right,
    height = height_param - margin.top - margin.bottom,
    height2 = height_param - margin2.top - margin2.bottom;

	var parseDate = d3.time.format("%Y%m%d").parse;
	var bisectDate = d3.bisector(function(d) { return d.date; }).left;
	
	var xScale = d3.time.scale()
	    .range([0, width]),
	
	    xScale2 = d3.time.scale()
	    .range([0, width]);
	
	var xScaleOrdinal = d3.scale.linear()
						.range([0, width]);
	
	var yScale = d3.scale.linear()
	    .range([height, 10]);
	
   
	var color = d3.scale.ordinal().range(colors);  
	
	
	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom"),
	
	    xAxis2 = d3.svg.axis() 
	    .scale(xScale2)
	    .orient("bottom");    
	
	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left");  
	
	var line = d3.svg.line()
	    //.interpolate("basis")
	    .x(function(d) { return xScale(d.date); })
	    .y(function(d) { return yScale(d.ts_entry); })
	    .defined(function(d) { return !isNaN(d.ts_entry); });
	
	var maxY;
	
	var ts_container = d3.select(target_container).append("div")
							.attr("id","ts_" + ts_id)
							.attr("class", "ts_container");
	
	var svg = ts_container.append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("id", ts_id);

	svg.append("rect")
	    .attr("width", width)
	    .attr("height", height)                                    
	    .attr("x", 0) 
	    .attr("y", 0)
	    .attr("id", ts_id + "mouse-tracker")
	    .style("fill", "white"); 
	
	//slider
	  
	var context = svg.append("g") // brushing context box container
	    .attr("transform", "translate(" + 0 + "," + 410 + ")")
	    .attr("class", "context");
	
	svg.append("defs")
	  .append("clipPath") 
	    .attr("id", "clip")
	    .append("rect")
	    .attr("width", width)
	    .attr("height", height); 
	
	
	//var ts_input_file = ts_type + "_" + ts_id + ".tsv";
	d3.tsv(ts_input_file, function(error, data) {
	
		  color.domain(d3.keys(data[0]).filter(function(key) { // Set the domain of the color ordinal scale to be all the csv headers except "date", matching a color to parameter key
		    return key !== "date"; 
		  }));
		
		  
		  var current_date = 0;
		  var dates_idx  = [];
		  data.forEach(function(d,i) { // Make every date in the tsv data a javascript date object format
		    d.date = parseDate(d.date);
		    dates_idx.push(i);
		    if(i == time)
		    	current_date = d.date;
		  });
		  
		
		  var categories = color.domain().map(function(name) { // Nest the data into an array of objects with new keys
		
		  var isVisible = false;
		      
		    //if(name !== "Special")
		    //	isVisible = false; 
		    
		    return {
		      name: name, // "name": the tsv headers except date; might change 'name' to 'header'
		      ts_color: color(name),
		      ts_current_date: current_date,
		      values: data.map(function(d) { // "values": which has an array of the times and values
		        return {
		          date: d.date, 
		          ts_entry: +(d[name]),
		          };
		      }),
		      visible: isVisible 
		    };
		  });
		
		  xScaleOrdinal.domain(d3.extent(dates_idx, function(d) { return d; }));
		  
		  xScale.domain(d3.extent(data, function(d) { return d.date; }));
		
		  yScale.domain([0, d3.max(categories, function(c) { return d3.max(c.values, function(v) { return v.ts_entry; }); })]);
		
		  xScale2.domain(xScale.domain());
		  
		  var special_ts = {};
		  if(special)
		  {
			  for(var i = 0; i < categories.length; i ++)
				  if (special.indexOf(categories[i].name) != -1) 
				  {
					  //alert("found special");
					  special_ts[categories[i].name] = categories[i].values;
					  //alert(special_ts.length);
				  }
		  }
			
		 
		 //update_date_indicator(d3.select("#"+ts_id), current_date);
		  //update_date(d3.select("#"+ts_id), current_date);
		  
		  
  
		 //for slider part
		
		 var brush = d3.svg.brush()//for slider bar at the bottom
		    .x(xScale2) 
		    .on("brush", brushed);
		
		  context.append("g") // Create brushing xAxis
		      .attr("class", "x axis1")
		      .attr("transform", "translate(0," + height2 + ")")
		      .call(xAxis2);
		
		  var contextArea = d3.svg.area() // Set attributes for area chart in brushing context graph
		    .interpolate("monotone")
		    .x(function(d) { return xScale2(d.date); }) // x is scaled to xScale2
		    .y0(height2) // Bottom line begins at height2 (area chart not inverted) 
		    .y1(0); // Top line of area, 0 (area chart not inverted)
		
		  //plot the rect as the bar at the bottom
		  context.append("path") 
		    .attr("class", "area")
		    .attr("d", contextArea(categories[0].values)) // pass first categories data .values to area path generator 
		    .attr("fill", "#F1F1F2");
		    
		  //append the brush for the selection of subsection  
		  context.append("g")
		    .attr("class", "x brush")
		    .call(brush)
		    .selectAll("rect")
		    .attr("height", height2) // Make brush rects same height 
		      .attr("fill", "#E6E7E8");  
		  //end slider part
		
		  // draw line graph
		  svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis);
		
		  svg.append("g")
		      .attr("class", "y axis")
		      .call(yAxis)
		    .append("text")
		      .attr("transform", "rotate(-90)")
		      .attr("y", 6)
		      .attr("x", -10)
		      .attr("dy", ".71em")
		      .style("text-anchor", "end")
		      //.text(ts_type)
		  	  //.attr("y-axis" + ts_id);
		
		  var category = svg.selectAll(".category")
		      .data(categories) // select nested data and append to new svg group elements
		    .enter().append("g")
		      .attr("class", "category");   
		
		  category.append("path")
		      .attr("class", "line")
		      .style("pointer-events", "none") // stop line interferring with cursor
		      .attr("id", function(d) {
		    	//alert("line-" + d.name.replace(" ", "").replace("/", ""));
		        return "line-" + d.name.replace(" ", "").replace("/", "");
		      })
		      .attr("d", function(d) { 
		    	  
		    	 /*
		    	  * draw dots instead of a line if the timeseries is "special"
		    	  * otherwise draw a line
		    	  */
		    	 
		    	 return draw_line(d, svg, line, special, special_ts);
		      })
		      .attr("clip-path", "url(#clip)")//use clip path to make irrelevant part invisible
		      .style("stroke", function(d) { return color(d.name); });
		
		  // draw legend
		  var legendSpace = 450 / categories.length; // expose legend size as parameter?
		
		  category.append("circle")
		      //.attr("width", 20)
		      //.attr("height", 20)
		  	  //.attr("r",20)
		  	  .attr("r",legendSpace/2.0)
		  	  .attr("param", function(d){ return d.name.replace(" ", "").replace("/", ""); })
		  	  .attr("emitted", false)
		      .attr("cx", width + (margin.right/3) - 25) 
		      .attr("cy", function (d, i) { return (legendSpace)+i*(legendSpace) - 4; })  // spacing
		      .attr("fill",function(d) {
		        return d.visible ? color(d.name) : "#F1F1F2";  
		      })
		      //.attr("stroke-width", 20)
		      .attr("class", "legend-box")
		
		      .on("click", function(d){ 
			  
		        d.visible = !d.visible;
		        
		        maxY = findMaxY(categories); // find max Y timeseries value categories data with "visible"; true
		        yScale.domain([0,maxY]); // redefine yAxis domain based on highest y value of categories data with "visible"; true
		        svg.select(".y.axis")
		          .transition()
		          .call(yAxis);   
		        
		        //svg.select("#y-axis" + ts_id).text(d.name.replace(" ", "").replace("/", ""));
		        
		        category.select("path")
		          .transition()
		          .attr("d", function(d){
		
		        	  return draw_line(d, svg, line, special, special_ts);
		        		 
		          })

		        category.select("circle")
		          .transition()
		          .attr("fill", function(d) {
		          return d.visible ? color(d.name) : "#F1F1F2";
		        });
		        
		    	comm_msg = typeof comm_msg !== 'undefined' ? comm_msg : false;
		        if (typeof(trigger_emit) == "function" && typeof(parse_comm_msg) == "function" && comm_msg !== false && comm_blacklist.indexOf(d3.select(this).attr("id")) == -1)
				{
					// parse comm_msg and, if requested, bind data attributes from d to comm_msg
					comm_msg = parse_comm_msg(comm_msg, d);
					//alert(Object.keys(comm_msg["selector"]["function"]["params"]));
					// emit comm_msg
					trigger_emit(this, comm_msg);
				}
				
		        
		      })
		
		      .on("mouseover", function(d){
		    	  //alert("timeseries!" + d.name.replace(" ", "").replace("/", ""));
		        d3.select(this)
		          .transition()
		          .attr("fill", function(d) { return color(d.name); });
		
		        d3.select("#line-" + d.name.replace(" ", "").replace("/", ""))
		          .transition()
		          .style("stroke-width", 2.5);  
		      })
		
		      .on("mouseout", function(d){
		
		        d3.select(this)
		          .transition()
		          .attr("fill", function(d) {
		          return d.visible ? color(d.name) : "#F1F1F2";});
		
		        d3.select("#line-" + d.name.replace(" ", "").replace("/", ""))
		          .transition()
		          .style("stroke-width", 1.5);
		      })
		      
		  category.append("text")
		      .attr("x", width + (margin.right/3)) 
		      .attr("y", function (d, i) { return (legendSpace)+i*(legendSpace); }) 
		      .text(function(d) { return d.name; }); 
		
		  var hoverLineGroup = svg.append("g") 
		            .attr("class", "hover-line");
		
		  var hoverLine = hoverLineGroup 
		        .append("line")
		            .attr("id", "hover-line")
		            .attr("x1", 10).attr("x2", 10) 
		            .attr("y1", 0).attr("y2", height + 10)
		            .style("pointer-events", "none") // stop line interferring with cursor
		            .style("opacity", 1e-6); 
		
		  var hoverDate = hoverLineGroup
		        .append('text')
		            .attr("class", "hover-text")
		            .attr("y", height - (height-40)) // hover date text position
		            .attr("x", width - 150) // hover date text position
		            .style("fill", "#E6E7E8");
		
		  var columnNames = d3.keys(data[0]) //grab the key values from first data row
		                                     //these are the same as column names
		                  .slice(1); //remove the first column name (`date`);
		
		  var focus = category.select("g") // create group elements to house tooltip text
		      .data(columnNames) // bind each column name date to each g element
		    .enter().append("g") //create one <g> for each columnName
		      .attr("class", "focus"); 
		
		  focus.append("text") // http://stackoverflow.com/questions/22064083/d3-js-multi-series-chart-with-y-value-tracking
		        .attr("class", "tooltip")
		        .attr("x", width + 20) // position tooltips  
		        .attr("y", function (d, i) { return (legendSpace)+i*(legendSpace); }); // (return (11.25/2 =) 5.625) + i * (5.625) // position tooltips       
		
		  // add mouseover events for hover line.
		  /*
		  d3.select("#"+ts_id+"mouse-tracker") // select chart plot background rect
		  .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
		  .on("mouseout", function() {
		      hoverDate
		          .text(null) // on mouseout remove text for hover date
		
		      d3.select("#hover-line")
		          .style("opacity", 1e-6); // On mouse out making line invisible
		  });
		  */
		
		  function mousemove() { 
			  
		      var mouse_x = d3.mouse(this)[0]; // Finding mouse x position on rect
		      var graph_x = xScale.invert(mouse_x); // get date
		      
		      //var mouse_y = d3.mouse(this)[1]; // Finding mouse y position on rect
		      //var graph_y = yScale.invert(mouse_y);
		      //console.log(graph_x);
		      
		      var format = d3.time.format('%b %Y'); // Format hover date text to show three letter month and full year
		      
		      hoverDate.text(format(graph_x)); // scale mouse position to xScale date and format it to show month and year
		      
		      d3.select("#hover-line") // select hover-line and changing attributes to mouse position
		          .attr("x1", mouse_x) 
		          .attr("x2", mouse_x)
		          .style("opacity", 1); // Making line visible
		
		      // Legend tooltips // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
		
		      /* d3.mouse(this)[0] returns the x position on the screen of the mouse. 
		      Next, take the position on the screen and convert it into an equivalent date */
		      var x0 = xScale.invert(d3.mouse(this)[0]), 
		      
		      i = bisectDate(data, x0, 1), // use bisectDate function declared earlier to find the index of the data array that is close to the mouse cursor
		      /*It takes the data array and the date corresponding to the position of mouse cursor and returns the index number of the data array which has a date that is higher than the cursor position.*/
		      d0 = data[i - 1],
		      d1 = data[i],
		      /*d0 is the combination of time and value that is in the data array at the index to the left of the cursor and d1
		       *  is the combination of date and close that is in the data array at the index to the right of the cursor. 
		       *  In other words we now have two variables that know the value and date above and below the date that corresponds to the position of the cursor.*/
		      d = x0 - d0.date > d1.date - x0 ? d1 : d0;
		
		      //d is now the data row for the date closest to the mouse position
		
		      focus.select("text").text(function(columnName){
		         //didn't explictly set any data on the <text>
		         //elements, each one inherits the data from the focus <g>
		
		         return (d[columnName]);
		      });
		  }; 
		
		  //for brusher of the slider bar at the bottom
		  function brushed() {
		
		    xScale.domain(brush.empty() ? xScale2.domain() : brush.extent()); // if brush is empty then reset the Xscale domain to default, if not then make it the brush extent 
		
		    svg.select(".x.axis") // replot xAxis with transition when brush used
		          .transition()
		          .call(xAxis);
		
		    maxY = findMaxY(categories); // find max Y value categories data with "visible"; true
		    yScale.domain([0,maxY]); // redefine yAxis domain based on highest y value of categories data with "visible"; true
		    //alert(maxY);
		    svg.select(".y.axis") // redraw yAxis
		      .transition()
		      .call(yAxis);   
		
		    category.select("path") // redraw lines based on brush xAxis scale and domain
		      .transition()
		      .attr("d", function(d){
		    	  
		    	  return draw_line(d, svg, line, special, special_ts);
		        		
		      });
		    
		  };      
	
	}); // end load tsv block
	  
	  function findMaxY(data){  
	    var maxYValues = data.map(function(d) { 
	      if (d.visible){
	        return d3.max(d.values, function(value) { // return max-y value
	          return value.ts_entry; })
	      }
	    });
	    return d3.max(maxYValues);
	  }
	  
	  
	  update_date = function update_date_indicator(ts_id, svg, date_idx)
	  {  
		  d3.select("#"+ts_id+"indicator").remove();
		  svg.append("g")
		  .append("line")
		  .attr("x1", xScaleOrdinal(date_idx))
		  .attr("y1", 0)
		  .attr("x2", xScaleOrdinal(date_idx))
		  .attr("y2", height)
		  .style("stroke-width", 2)
		  .style("stroke", "red")
		  .attr("id",ts_id+"indicator")
		  .style("fill", "none");  
	  }
	  
	  function draw_special(svg, timeseries, line, special_name)
	  {
		  
		  //alert("drawing special")
		  //alert(timeseries.length)
		  svg.selectAll(".dot"+special_name)
 		 .data(timeseries.filter(function(d) { return !isNaN(d.ts_entry); }))
 		  .enter().append("circle")
 		    .attr("class", "dot"+special_name)
 		    .attr("cx", line.x())
 		    .attr("cy", line.y())
 		    .attr("fill", color(special_name))
 		    .attr("stroke", "#000")
 		    .attr("stroke-width", "1.5px")
 		    .attr("r", 5)
 		    .attr("clip-path", "url(#clip)")//use clip path to make irrelevant part invisible;
	  }
	  
	  function remove_special(svg, special_name)
	  {
		  //alert("removing special")
		  svg.selectAll(".dot"+special_name).remove();
 		 
	  }
	  
	  /*
	   * helper function drawing line or scatters (is "special" timeseries are provided)
	   * d: data bound to the line element
	   * svg: svg element in which the line is drawn
	   * line: svg line 
	   * special: name of special timeseries; false otherwise
	   * special_ts: timeseries data for the special timeseries
	   * 
	   *  TODO: 
	   *  - allow various plots styles for special (nto just scatter)
	   */
	  function draw_line(d, svg, line, special, special_ts)
	  {

		  //draw date indicator		  
		  if(special)
	      {
			  
			  if(special_ts.hasOwnProperty(d.name)) 
		 	  {
		 		 if(d.visible)
		 			 draw_special(svg, d.values, line, d.name);
		 		 else
		 			 remove_special(svg, d.name);
		 	  }	
		      else
		      {
		    	if(d.visible)
		    	{
		    	// remove and redraw all special scatters in case yaxis is rescaled
		    	 for (special_name in special_ts)
		    		 if(special_ts.hasOwnProperty(special_name))
		    		 {
		    			 remove_special(svg, special_name);
		     			 draw_special(svg, special_ts[special_name], line, special_name);
		    		 }
		    	}
		      }
	      }
		  return d.visible ? line(d.values) : null; // if d.visible is true then draw line
	  }
	  
	  return xScaleOrdinal;
}