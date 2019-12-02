import React from 'react';

import axios from 'axios';
import moment from 'moment-timezone';

import Chart from '../Chart';
import TableOrders from '../Table';


import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';

import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import CircularProgress from '@material-ui/core/CircularProgress';

import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';

import ProductChart from '../ProductChart';

import '../App.css';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            resultDelivered:[],
            inventory : [],
            orderItems : [],
            numberOfGuests : 0,
            startDate : moment().startOf('month').startOf('day').format(),
            endDate : moment().endOf('day').format(),
            statusSelected : "shipped",
            financeVar:{},
            isLoading:true,
            accessToken:sessionStorage.getItem("accesstoken"),
            itemSoldList : []
        };
    }
    componentDidMount() {
      //this.dataDelivered();
      console.log(this.state.accessToken);
      this.loopPromises();
    }

    loopPromises = async() => {
      await this.setState({isLoading : "Getting Orders..."});
      let inventoryGet = await axios.get("https://lazada-node-server.herokuapp.com/");
      let inventoryPrepare = [];
      inventoryGet = inventoryGet.data.forEach(x => {
        inventoryPrepare.push(x.product);
      });
      console.log(inventoryPrepare);

      let dayDiffer = moment(this.state.endDate).diff(moment(this.state.startDate),"days");
      console.log(dayDiffer);

      let axiosPromises = [];

      let startAxios = axios.post(`https://lazada-song-ws.herokuapp.com/getorders`,{
        shipstatus : this.state.statusSelected,
        startdate : moment(this.state.startDate).startOf('day').format(),
        enddate : moment(this.state.startDate).endOf('day').format(),
        accesstoken: this.state.accessToken
      });

      axiosPromises.push(startAxios);

      for (let i=1;i<=dayDiffer;i++) {
        let startDate = moment(this.state.startDate).add(i,"days").startOf('day').format();
        let endDate = moment(this.state.startDate).add(i,"days").endOf('day').format();

        const data = axios.post(`https://lazada-song-ws.herokuapp.com/getorders`,{
          shipstatus : this.state.statusSelected,
          startdate : startDate,
          enddate : endDate,
          accesstoken: this.state.accessToken
        });
        
        axiosPromises.push(data);
      }

      Promise.all(axiosPromises).then( async(response) => {
        console.log(response);
        await this.setState({isLoading : "Getting Products..."});
        let orders = response.map(x => x.data.data.orders);
        let _orders = Array.prototype.concat(...orders);
        console.log(_orders);
        let orderIDs = _orders.map(x => x.order_id.toString() );
        console.log(orderIDs,"CONSOLE LOG");
        orderIDs = JSON.stringify(orderIDs);
        
        await this.setState({resultDelivered : _orders, inventory : inventoryPrepare});
        this.getOrderItems(orderIDs);
      });
      
    }


    getOrderItems = (ordersReceive) => axios.post(`https://lazada-song-ws.herokuapp.com/getorderitems`,{
      "orders" : ordersReceive,
      accesstoken: this.state.accessToken
    }).then(response => {
      this.setState({orderItems : response.data.data},async() => {
        await this.setState({isLoading : "Calculating data points and financial statistic..."});
        this.calculatePoints();
      });
    });

    handleInputChange = (event) => {
      console.log(event);
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;

      console.log(value);
  
      this.setState({
        [name]: value
      });
    }

    handleStartDate = (e) => {
      let value = moment(e).startOf('day').format();
      this.setState({startDate : value});
      console.log(value);
    }
    handleEndDate = (e) => {
      let value = moment(e).endOf('day').format();
      this.setState({endDate : value});
      console.log(value);
    }

    setFinance = (data) => {
      this.setState({
        financeVar : data
      });
      console.log(data);
    }

    calculatePoints = () =>{

        let priceArray = [];
        let shippingFeeArray =[];
        let labels = [];
        let shippingFeeExceedArray = [];
        let profitArray = [];
        let costArray = [];

        let ordersInventory = [];
        let voucherSellerArray = [];

        let shopSKUs = [];
    
        this.state.resultDelivered.forEach(x => {
          labels.push(new Date(x["created_at"]));
          priceArray.push(x["price"].replace(",",""));
          shippingFeeArray.push(parseFloat(x["shipping_fee"]) );
          shippingFeeExceedArray.push( parseFloat(x["shipping_fee"]) - 45 );
          voucherSellerArray.push( parseFloat(x["voucher_seller"]) );
      
      
      
          //profit
          let matchedOrder = this.state.orderItems.find(order => order["order_id"] === x["order_id"]);
          if(matchedOrder) {
            let profit = 0;
            let cost = 0;
            matchedOrder.order_items.forEach(each => {
              try {
                let matchedInventory = this.state.inventory.find(inv => inv["ShopSku"] === each["shop_sku"]);
                shopSKUs.push(matchedInventory["ShopSku"].split("-")[0]);
                console.log(matchedInventory);
                let profitInner =  (parseFloat(each["item_price"]) - (parseFloat(each["item_price"])* 0.0214) ) - parseFloat(matchedInventory.cost);
                cost+=parseFloat(matchedInventory.cost);
                profit+=profitInner
  
                ordersInventory.push({
                  orderId : each["order_id"],
                  inventoryName : matchedInventory["SellerSku"],
                  inventoryPrice : each["item_price"],
                  inventoryCost : matchedInventory.cost,
                  profit : profitInner,
                  profitToRevenue : ((profitInner / each["item_price"])*100).toFixed(2)
                });
              }
              catch(err) {
                try {
                  let inventoryErr = require("../inventory.json");
                  let matchedInventory = inventoryErr.find(inv => inv["Shop SKU"] === each["shop_sku"]);
                  console.log(matchedInventory.cost, matchedOrder["order_id"]);
                  let profitInner =  (parseFloat(each["item_price"]) - (parseFloat(each["item_price"])* 0.0214) ) - parseFloat(matchedInventory.cost);
                  cost+=parseFloat(matchedInventory.cost);
                  profit+=profitInner
    
                  ordersInventory.push({
                    orderId : each["order_id"],
                    inventoryName : matchedInventory["SellerSku"],
                    inventoryPrice : each["item_price"],
                    inventoryCost : matchedInventory.cost,
                    profit : profitInner,
                    profitToRevenue : ((profitInner / each["item_price"])*100).toFixed(2)
                  });
                }
                catch(err2) {
                  //redirect to success screen
                  
                }
              }
              
            });
    
            profit-=parseFloat(x["voucher_seller"]);

            costArray.push(cost);
            profitArray.push(profit);
          }

          
    
        });

        var store = shopSKUs,
            distribution = {},
            max = 0,
            result = [];

        store.forEach(function (a) {
            distribution[a] = (distribution[a] || 0) + 1;
            if (distribution[a] > max) {
                max = distribution[a];
                result = [a];
                return;
            }
            if (distribution[a] === max) {
                result.push(a);
            }
        });
        console.log('max: ' + max);
        console.log('key/s with max count: ' + JSON.stringify(result));
        console.log(distribution);

        let itemSoldList = [];
        Object.keys(distribution).forEach((item,idx) => {
          console.log(distribution[item]); // key
          let foundIMG = this.state.inventory.find( x => x.ShopSku.split("-")[0] === item);
          // console.log(foundIMG.Images[0]);
          let itemSold = {itemId : item, itemSold : distribution[item], img : foundIMG.Images[0]};
          itemSoldList.push(itemSold);
        });



        let financeVar = {
          profit : profitArray.reduce((a, b) => parseFloat(a) +  parseFloat(b), 0),
          price : priceArray.reduce((a, b) => parseFloat(a) +  parseFloat(b), 0),
          shippingFee : shippingFeeArray.reduce((a, b) => parseFloat(a) +  parseFloat(b), 0),
          shippingFeeExceed : shippingFeeExceedArray.reduce((a, b) => parseFloat(a) +  parseFloat(b), 0),
          cost : costArray.reduce((a, b) => parseFloat(a) +  parseFloat(b), 0),
          voucherSeller : voucherSellerArray.reduce((a, b) => parseFloat(a) +  parseFloat(b), 0),
          ordersInventory : ordersInventory,
          orderCount : profitArray.length,
          itemSold : ordersInventory.length,
          itemSoldList : itemSoldList,
          mostSold : {itemId : result, count : max, url : `https://www.lazada.co.th/products/i${result[0].split("_")[0]}.html`}
        };

        this.setState({financeVar : financeVar, itemSoldList : itemSoldList}, () => {
          // console.log(financeVar.ordersInventory);
          this.setState({isLoading : false});
        });
    }

    renderProductchart = () => {
      let renderThis = this.state.itemSoldList.map(x => {
        return <div>
            <ProductChart id={x.itemId} count={x.itemSold} url={x.img} MIN={0} MAX={this.state.financeVar.mostSold.count}/>
            <Divider />
          </div>
      });
      return <div>{renderThis}</div>
    }

    render() {
      if (this.state.isLoading) {
        return <div className="container d-flex vh-100 justify-content-center">
          <div className="align-self-center align-items-center d-flex">
            <div>
              <CircularProgress />
            </div>
            <div className="px-3">
              <h4>{this.state.isLoading}</h4>
            </div>
          </div>
        </div>
      }
        return (
          <div>
            <Paper className="d-flex justify-content-around align-items-center position-sticky bg-white py-3" style={{top:0,zIndex:1000}}>
              <div className="d-flex justify-content-around flex-column">
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <KeyboardDatePicker
                    name="startDate"
                    margin="normal"
                    id="date-picker-dialog"
                    label="Start Date (Before Date)"
                    format="MM/dd/yyyy"
                    value={this.state.startDate}
                    onChange={this.handleStartDate}
                    KeyboardButtonProps={{
                      'aria-label': 'change date',
                    }}
                  />

                  <KeyboardDatePicker
                    name="startDate"
                    margin="normal"
                    id="date-picker-dialog"
                    label="End Date (After Date)"
                    format="MM/dd/yyyy"
                    value={this.state.endDate}
                    onChange={this.handleEndDate}
                    KeyboardButtonProps={{
                      'aria-label': 'change date',
                    }}
                  />
                </MuiPickersUtilsProvider>
              </div>
              <div>
                <FormLabel component="legend">Status</FormLabel>
                <RadioGroup aria-label="statusSelected" name="statusSelected" value={this.state.statusSelected} onChange={(e) => this.setState({statusSelected : e.target.value}) }>
                <FormControlLabel value="delivered" control={<Radio />} label="Delivered" />
                <FormControlLabel value="shipped" control={<Radio />} label="Shipped" />
                <FormControlLabel value="canceled" control={<Radio />} label="Canceled" />
                <FormControlLabel value="ready_to_ship" control={<Radio />} label="Ready to Ship" />
              </RadioGroup>
              </div>
              <div>
                <Button variant="contained" color="primary" onClick={() => this.loopPromises()}>
                  Submit
                </Button>
              </div>
            </Paper>
            <div className="container" >
              <Divider/>
              <div className="d-flex justify-content-between pt-3 flex-column">
                <div className="">
                  <h2>Financial Statistic</h2>
                  <div className="d-flex justify-content-around align-items-center flex-row">
                    <List>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Revenue | ยอดขาย"
                          secondary={this.state.financeVar.price + " Baht"}
                        />
                      </ListItem>
                      <Divider/>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Cost | ต้นทุน"
                          secondary={this.state.financeVar.cost + " Baht"}
                        />
                      </ListItem>
                      <Divider/>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Profit | กำไร"
                          secondary={this.state.financeVar.profit.toFixed(2) + " Baht"}
                        />
                      </ListItem>
                      <Divider/>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Profit Ratio | กำไร ต่อ ยอดขาย"
                          secondary={((this.state.financeVar.profit / this.state.financeVar.price) * 100).toFixed(2) + "%"}
                        />
                      </ListItem>
                    </List>
                    <List>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Order Count | จำนวน Order"
                          secondary={this.state.financeVar.orderCount + " Orders"}
                        />
                      </ListItem>
                      <Divider/>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Item Sold | จำนวนสินค้าขาย"
                          secondary={this.state.financeVar.itemSold + " Items"}
                        />
                      </ListItem>
                      <Divider/>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Discount | ลดราคา"
                          secondary={this.state.financeVar.voucherSeller.toFixed(2) + " Baht"}
                        />
                      </ListItem>
                      <Divider/>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary="Top sell item | สินค้าขายมากสุด"
                          // secondary={`${this.state.financeVar.mostSold.itemId} ${this.state.financeVar.mostSold.count} Items`}
                          secondary={<Link href={this.state.financeVar.mostSold.url} target="_blank" variant="body2">
                            {`${this.state.financeVar.mostSold.itemId} ${this.state.financeVar.mostSold.count} Items`}
                          </Link>}
                        />
                      </ListItem>
                    </List>
                  </div>
                </div>
                <Divider />
                <div className="py-5">
                  <h3>Top Product</h3>
                  {this.renderProductchart()}
                </div>
                <Divider />
                
                <div className="w-100 py-5">
                  <h3>Financial Chart</h3>
                  <Chart setFinance={this.setFinance} dataPoints={this.state.resultDelivered} inventory={this.state.inventory} dataOrderItems={this.state.orderItems}/>
                </div>
              </div>
              <div className="">
                <TableOrders orderData={this.state.financeVar.ordersInventory}/>
              </div>
              
            </div>
          </div>
        );
    }
}
