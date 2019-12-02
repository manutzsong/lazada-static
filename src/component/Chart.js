import React from 'react';
import {Line} from 'react-chartjs-2';


export default ({resultData}) => {

    const data = {
      
      labels: resultData.created_at,
      datasets: [{
        label: 'Price',
        data: resultData.totalPaidToSeller,
        borderColor: '#2196f3',
        fill: false
      }, {
        label: 'Shipping Fee',
        data: resultData.totalShippingByCust,
        borderColor: '#9c27b0',
        fill: false
      }, {
        label: 'Shipping Exceed',
        data: resultData.totalShippingExceed,
        borderColor: '#009688',
        fill: false
      }, {
        label: 'Profit',
        data: resultData.totalProfitToSeller,
        borderColor: '#4caf50',
        fill: false
      }, {
        label: 'Cost',
        data: resultData.totalCost,
        borderColor: '#ff9800',
        fill: false
      }]
    };
  
    const options = {
      tooltips: {
         mode: 'index',
         intersect: false
      },
      hover: {
         mode: 'index',
         intersect: false
      },
      bezierCurve : false,
      elements: {
          line: {
              tension: 0
          }
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            tooltipFormat: 'LLL',
            displayFormats: {
                millisecond: 'HH:mm:ss.SSS',
                second: 'HH:mm:ss',
                minute: 'HH:mm',
                hour: 'MMM D h:mm',
                'day': 'MMM D h:mm',
                'week': 'MMM D h:mm',
                'month': 'MMM D h:mm',
                'quarter': 'MMM D h:mm',
                'year': 'MMM D YYYY h:mm',
            }
          }
      }]                 
    }
   }



   return (
        <Line data={data} options={options} />
    );

    
}