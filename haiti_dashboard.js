var gazeteer_select_model = "var-pop-migration-sweep-clinical-cases-5yr-avg-per-1000-calibration-period-2010-2014";
var gazeteer_select = "grandanse_migration_scales_sweep_var_pop_1e-3";
var node_select = "unselect";

function load_dashboard(gazetteer_file, gazetteer_header_file, map_data_file)
{
	this.svg_maps = d3.select(".resourcecontainer.maps");
	svg_maps.html("") // clear any existing content
	
	this.svg_charts = d3.select(".resourcecontainer.charts");
	svg_charts.html("") // clear any existing content 
	
	this.svg_timeseries = d3.select(".resourcecontainer.timeseries");
	svg_timeseries.html("") // clear any existing content 
	
	d3.json(gazetteer_header_file, function(error, gazetteer_header){
		load_gazeteer(gazetteer_file, gazetteer_header, map_data_file);
	});
}


function load_gazeteer(gazetteer_file, gazetteer_header, map_data_file)
{
	
	d3.select(".resourcecontainer.buttons").selectAll(".gazeteer").remove(); // clean up content
	
	this.svg_maps = d3.select(".resourcecontainer.maps");
	svg_maps.selectAll("*").remove() // clear any existing content
	
	this.svg_charts = d3.select(".resourcecontainer.charts");
	svg_charts.selectAll("*").remove() // clear any existing content 
	
	this.svg_timeseries = d3.select(".resourcecontainer.timeseries");
	svg_timeseries.selectAll("*").remove() // clear any existing content 
	
	// building dashboard options header
	// (e.g. parameter names)
	var gazeteer_selection =  d3.select(".resourcecontainer.buttons").append("ul").html("<li class = 'gazeteer_options_header'>" + gazetteer_header + "</li>")
			.attr("class", "gazeteer");
	
				/* the usual  d3js append function call (below) produces bad html in the context of additionally appended list items binded to data (further below) */
	
				/*
				.append("li")
				.attr("class", "gazeteer_options_header")
				.html(calib_params_names);
				*/
			
	// options of experiments/models and the respective models' parameters values
	// one of the models may be selected at a time 
	d3.json(gazetteer_file, function(error, gazeteer) {
		gazeteer_selection.selectAll("li.gazeteer_option")
			.data(gazeteer)
			.enter().append("li")
			 .attr("value", function (d) {
				 	return d.model; 
			 		})
			 .attr("class", function(d){ if(d.model == gazeteer_select_model) return "gazeteer_model_selected"; else return "gazeteer_model";})
			 /*
			 .on("click", function (d) {
				 				 
				 gazeteer_select_model = d.model;
				 load_gazeteer(gazetteer_file, gazetteer_header, map_data_file);
			 })
			 */
            .html(function(d){ return "<b>"+d.model+"</b>" + "<br/>" + d.params })
            .append("select")
            .selectAll("option")
            .data(function(d) { return d.select; })
            .enter().append("option")
            	.attr("value", function(d){ return d.value })
            	.attr("id", function(d){ return "model_"+d.value; })
            	.text(function(d){ return d.name})
            	.attr("selected", function(d){ if (d.value == gazeteer_select) return true;})
				.on("click", function (d) {
						//d3.select("#model_"+gazeteer_select).attr("class","gazeteer_model").attr("selected", false);
						//d3.select("#model_"+d.value).attr("class","gazeteer_model_selected").attr("selected", true);
					
						// change selected model parameters
						d3.select("#model_"+gazeteer_select).attr("selected", false);
						
						d3.select("#model_"+d.value).attr("selected", true);
						
			            gazeteer_select = d.value;
			           
			            //load_maps(map_data_file);
			            
			            gazeteer_select_model = d3.select(this.parentNode.parentNode).datum().model;
						load_gazeteer(gazetteer_file, gazetteer_header, map_data_file);
			            
			         // clear the existing ts
		        	 d3.select(".ts_container").remove();
		        	
		        	 // clear the existing node annotation
		        	 d3.select("#node-annotations").remove();
			            
			            /*
			            if(node_select != "unselect")
			            	load_node_charts({});
			            */
			               
				}) 	
		});
	
	   
       load_maps(map_data_file); // load widgets with data state corresponding to the selected model
	    // clear the existing ts
	   	d3.select(".ts_container").remove();
	   	
	   	// clear the existing node annotation
	   	d3.select("#node-annotations").remove();
       /*
       if(node_select != "unselect")
    	   load_node_charts({});
       */
}


function load_node_charts(params)
{

	
	
	
	// restore style of nodes
	selected_nodes = document.getElementsByClassName(node_select);
	for (var i = 0; i < selected_nodes.length; i++)
	{
		var node = selected_nodes[i];
		node.style.stroke = "gray";
	}

	// re-initialize parameters to be selected relevant for this node
	//params_select = []
	
	if (params.hasOwnProperty("NodeLabel"))
		node_select = params["NodeLabel"] 
	

	selected_nodes = document.getElementsByClassName(node_select);
	
	for (var i = 0; i < selected_nodes.length; i++)
	{
		
		var node = selected_nodes[i];
		node.style.stroke = "black";
		node.style.strokeWidth = "2px";
		
		// blacklist communication from this node, to avoid potential infinite "message" loops 
		comm_blacklist.push(node.id);

		trigger_event(node, "mouseover");
		
		comm_blacklist.pop(node.id);
	}

	// clear the existing ts
	d3.select(".ts_container").remove();
	
	// clear the existing node annotation
	d3.select("#node-annotations").remove();
	
	// draw the new timeseries
	timeseries(node_select);
	
	// display node data annotation	
	d3.select(".resourcecontainer.timeseries")
		.append("div")
		.attr("id", "node-annotations")
		.attr("float", "left");
		


	if(params != {})
	{
		d3.select("#node-annotations").selectAll("p")
			.data(d3.entries(params))
			.enter()
			.append("p")
			.attr("id", "node-annotation-" +node_select)
			.attr("position","relative")
			.html(
					function(d){
						var text;
						if(d.key == "NodeLabel")
						{
							text = "<br /><b>Node label:</b> " + d.value;  
						}
						else
						if(d.key == "5yr-avg-Pf-Incidence-per-1000-model")
						{
							var cc_inc_model = d.value;
							text = "<b>Avg. # clinical cases per 1000 (model):</b> " + cc_inc_model.toPrecision(3);
						}
						else
						if(d.key == "Pf-Incidence-per-1000")
						{
							var cc_inc_data = d.value;
							text = "<b>Avg. # clinical cases per 1000 (data):</b> " + cc_inc_data.toPrecision(3);
						}
						else
						if(d.key == "Population")
						{
							var pop = d.value;
							text = "<b>Population:</b> " + pop.toPrecision(1);
						}
						
						return text;
					}
			);
	}
	
}


function timeseries(node_label)
{
	
	if(!d3.select('.resourcecontainer.timeseries').select(".ts_container").empty()) // make sure there is one timeseries chart w/ a given id displayed at a time
		return;
	
	load_timeseries(
			gazeteer_select + '_clinical_cases_best_fit_' + node_label + '.tsv',
			gazeteer_select + '_clinical_cases_best_fit_' + node_label,
			gazeteer_select + '_Grand\'Anse node ' + node_label + ' timeseries', 
			['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'],
			{"special":"observed"},
			".resourcecontainer.timeseries",
			{
	   			"attributes_req":["name", "ts_color"] // request the header name
			}
	);	
}

function load_maps(map_data_file)
{	
	d3.select(".resourcecontainer.maps").selectAll("*").remove(); // clear all maps
	d3.select(".resourcecontainer.charts").selectAll("*").remove(); // clear all charts

	// load the map file relevant for the gazetteer selection
	
	map = gazeteer_select + "_" + map_data_file;
	//alert(map);
	load_map(
			   'Haiti_clinical_cases_incidence_per_1000_data', // map id 
	 		   map, 
	 		   ".resourcecontainer.maps", //target container,
	 		   {
	 			   width:600,
	 			   height:500,
	 			   node_opacity:0.8,
				   base_tile_layer : L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				   	  })
	 		   }
	);		

	style_map(
			'Haiti_clinical_cases_incidence_per_1000_data', 
		    map,
		    { 
			   node_attr_2_color: ["Pf-Incidence-per-1000", d3.scale.quantize().domain([0, 10]).range(colorbrewer.OrRd[5])],
			   node_attr_2_radius : ["Population", d3.scale.sqrt().domain([100, 100000]).range([2, 10])]
		    },
		    {
	   			"selector":{"function": {"func":load_node_charts, "params":{}}},
	   			"attributes_req":["NodeLabel", "5yr-avg-Pf-Incidence-per-1000-model", "Pf-Incidence-per-1000", "Population", "Latitude", "Longitude"]
			}
	);
	
	load_map(
	 		   'Haiti_clinical_cases_incidence_per_1000_model', // map id 
	 		   map, 
	 		   ".resourcecontainer.maps", //target container
	 		   {
	 			width:600,
	 			height:500,
	 			node_opacity:0.8,
				base_tile_layer : L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			   	  })
	 		   }
	);
	
	style_map(
	 		   'Haiti_clinical_cases_incidence_per_1000_model', 
	 		   map,
	 		   
	 		   {
			   		   node_attr_2_color : ["5yr-avg-Pf-Incidence-per-1000-model", d3.scale.quantize().domain([0, 10]).range(colorbrewer.OrRd[5])],
			   		   node_attr_2_radius : ["Population", d3.scale.sqrt().domain([100, 100000]).range([2, 10])]
			   	},
			   	{
			   			"selector":{"function": {"func":load_node_charts, "params":{}}},
			   			"attributes_req":["NodeLabel", "5yr-avg-Pf-Incidence-per-1000-model", "Pf-Incidence-per-1000", "Population", "Latitude", "Longitude"]
		   		}
	);	
}