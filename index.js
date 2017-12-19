var svg = d3.select("#decentraland-map").append('svg');
document.querySelector('#decentraland-map svg').style.display = 'none';

function highlightAddress (id, highlightclass) {
	let addresses = svg.selectAll('#id-'+id);
	addresses.attr("class", ""+ highlightclass);
}

function calculateTotalsForAddress(address) {
	totals = d3.nest()
		.key(function(d) { return d.address === address; })
		.rollup(function(v) {
			return {
				numland: v.length,
				totalbids: d3.sum(v, function(d) { return d.amount; }),
				maxbid: d3.max(v, function(d) { return d.amount; })
			};
		}).object(landdata);
	return totals['true'];
}

function request_dcl_map() {
	document.querySelector('#svg_loader').style.display = 'block';

	var blocksize = 5;
	var mapoffset = 150;
	var width = (mapoffset*blocksize) * 2 + blocksize;
	var height = (mapoffset*blocksize) * 2 + blocksize;
	var color = d3.scaleOrdinal(d3.schemeCategory10);

	document.querySelector('#decentraland-map svg').style.display = 'block';
	svg.attr('width', '100%')
		.attr('height', '90%')
		.attr('viewBox', '0 0 ' + width + ' ' + height);

	var zoomLayer = svg.append("g");
	var zoomed = function() {
		zoomLayer.attr("transform", d3.event.transform);
	};

	svg.call(d3.zoom()
		.scaleExtent([0.1, 12])
		.on("zoom", zoomed)
	);

	var div = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

	// axios.get('https://decentraland.fyi/static/dcl_fullmap.json')
	axios.get('/static/dcl_fullmap.json')
		.then((res) => {
			landdata = res.data.data;

			zoomLayer.selectAll("rect")
				.data(landdata)
				.enter()
				.append("rect")
				.attr("id", function (d) { return 'id-'+(d.address === null ? d.id : d.address);})
				.attr("x", function(d){
					return (d.x*blocksize)+(width/2)+1;
				})
				.attr("y", function(d){
					return ((d.y*-1)*blocksize)+(height/2)+1;
				})
				.attr("height", blocksize)
				.attr("width", blocksize)
				.attr("fill", function(d) {return d.projectId !== null ? '#BFBFBF' : color(d.amount/100) ;})
				.on("click", function(d) { window.open('https://etherscan.io/address/'+d.address);console.log(d);})
				.on("mouseover", function(d) {
					highlightAddress(d.address,'highlightAddress');
					let totals = calculateTotalsForAddress(d.address);

					div.transition().duration(100).style("opacity", 0.8);
					div.html("Id:"+ d.id
						+ "<br/>" + (d.projectId !== null ? 'Non biddable' : 'Bid:'+d.amount)
						+ "<br/>Total Land:"+ totals.numland
						+ "<br/>Total m&#xb2;:"+ totals.numland*100
						+ "<br/>Total Bid:"+ totals.totalbids
						+ "<br/>Max Bid:"+ totals.maxbid
					).style("left", (d3.event.pageX + 10) + "px").style("top", (d3.event.pageY ) + "px");

				})
				.on("mouseout", function(d) {
					div.transition()
					.duration(400)
					.style("opacity", 0);
					highlightAddress(d.address,'');
				})
				;

			document.querySelector('#svg_loader').style.display = 'none';
		}
	);
}
