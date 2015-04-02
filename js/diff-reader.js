function log (stuff) {
	document.getElementById('log').textContent = JSON.stringify(stuff, null, 2);
}

var diffStr = localStorage.diffs || '[["A1"],["$1","A2"],["$2","A3"],["$3","A4"],["$4","A5"],["$4","R1"],["$4","A5"],["$3","R1","$1"],["$3","A4","$1"],["$1","R2","$2"],["$1","A2","$2"],["$2","A3","$2"],["$2","R1","$2"],["$2","A3","$2"],["$5","A6"]]';
var diff = JSON.parse(diffStr);
log(diff);

function readDiff(diff) {
	var finalContent = '';
	diff.forEach(function(diff){
		var i = 0;
		diff.forEach(function(diffOp){
			var mode = diffOp[0];
			var content = diffOp.slice(1);
			var num = content*1;
			
			// addition
			if (mode === 'A') {
				finalContent = finalContent.substr(0, i) + content + finalContent.slice(i-1+content.length);
				// console.log('added ' + JSON.stringify(content) + ' at ' + i);
				i += content.length;
			}

			// removal
			else if (mode === 'R') {
				finalContent = finalContent.substr(0, i) + finalContent.slice(i+num);
				// console.log('removed ' + num + ' at ' + i);
				// console.log(finalContent.substr(0, i), '-', finalContent.slice(i+num));
			}

			// unchanged data
			else if (mode === '$') {
				// console.log('no action for ' + num + ' characters');
				i += num;
			}
		});
		console.log(finalContent);
	});
	console.log(finalContent);
}

readDiff(diff);