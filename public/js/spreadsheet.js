  document.getElementsByTagName('iframe')[0].onload = function() {
        var h5Table = document.getElementById('h5-table');
        var thList=h5Table.getElementsByTagName("th");
        var tbodyList=h5Table.getElementsByTagName("tbody");
        var records=tbodyList.item(0).getElementsByTagName("tr");
        var labelValues=[];
  var myData = [];
  for(var index=0;index<records.length;index++){
      var tdList=records.item(index).getElementsByTagName("td");
      
      labelValues.push(tdList.item(0).innerText);
      if(index===0){
          for(var tdIndex=1;tdIndex<tdList.length;tdIndex++){
              myData.push({});
              myData[tdIndex-1].values=[];
              myData[tdIndex-1].key=thList.item(tdIndex).innerText;
              //myData[tdIndex-1].color=
          }
          
      }
      for(var tdIndex=1;tdIndex<tdList.length;tdIndex++){
          myData[tdIndex-1].values.push({x: index, y: parseFloat(tdList.item(tdIndex).innerText)});
      }
      
  }
  
  console.log(myData);
}
