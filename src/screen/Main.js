import React from "react";

import axios from "axios";
import moment from "moment-timezone";

import "date-fns";
import CircularProgress from "@material-ui/core/CircularProgress";
import retryInterceptor from "axios-retry-interceptor";
import "../App.css";

import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import Button from "@material-ui/core/Button";

import "date-fns";
import DateFnsUtils from "@date-io/date-fns";
import {
	MuiPickersUtilsProvider,
	KeyboardDatePicker
} from "@material-ui/pickers";

import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import Divider from "@material-ui/core/Divider";

import LineChart from "../component/Chart";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import Link from "@material-ui/core/Link";

// const urlAPI = "http://lazada-song-ws.herokuapp.com";
const urlAPI = "http://localhost:3002";

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			startDateUserSelect: moment()
				.add(-7, "days")
				.startOf("day")
				.format(),
			endDateUserSelect: moment()
				.endOf("day")
				.format(),
			statusOrder: "delivered",
			inventory: [],
			inventoryCount: 0,
			saveOrders: [],
			saveOrderItems: [],
			saveFinanceOrder: [],

			isLoading: true,
			accessToken: sessionStorage.getItem("accesstoken"),
			left: false,

			resultTransactionArray: null
		};
	}
	componentDidMount() {
		this.getData();
	}

	sortObject = (obj, whatKey) => {
		var arr = [];
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				arr.push({
					key: prop,
					value: obj[prop][whatKey],
					product: obj[prop].product
				});
			}
		}
		arr.sort(function(a, b) {
			return b.value - a.value;
		});
		//arr.sort(function(a, b) { a.value.toLowerCase().localeCompare(b.value.toLowerCase()); }); //use this to sort as strings
		return arr; // returns array
	};

	getData = async () => {
		let result = await axios.get("http://localhost:3002");

		let resultTransaction = await axios.post("http://localhost:3002/finance", {
			startdate: this.state.startDateUserSelect,
			enddate: this.state.endDateUserSelect,
			status: this.state.statusOrder,
			accesstoken: this.state.accessToken
		});

    console.log(result, resultTransaction);
    if (resultTransaction.data.arrayOfOrder.length === 0) {
      this.retryBlock();
    }
    else {
      // let flattenTransaction = resultTransaction.flat();
      let flattenTransactionProduct = resultTransaction.data.arrayOfOrder.map(
        x => x.totalProduct
      );
      flattenTransactionProduct = flattenTransactionProduct.flat();
      console.log(flattenTransactionProduct);
      let counts = {};
      flattenTransactionProduct.forEach(i => {
        // countFlattenTransaction[ i.shop_sku.split("_")[0] ].count = countFlattenTransaction[ i.shop_sku.split("_")[0] || 0 +=1
        if (typeof counts[i.shop_sku.split("_")[0]] === "undefined") {
          counts[i.shop_sku.split("_")[0]] = { count: 1, product: i };
        } else {
          counts[i.shop_sku.split("_")[0]].count =
            (counts[i.shop_sku.split("_")[0]].count || 1) + 1;
        }
      });

      counts = this.sortObject(counts, "count");
      // counts = Object.keys(counts).sort((a, b) => a.count.localeCompare(b.count));
      console.log(counts);

      let resultTransactionArray = {
        created_at: [],
        orderId: [],
        totalBeforeDeduct: [],
        totalFeeName: [],
        totalPaidToSeller: [],
        totalProduct: [],
        totalProfitToSeller: [],
        totalPromotionFlexi: [],
        totalPromotionVoucher: [],
        totalShippingByCust: [],
        totalShippingCharge: [],
        totalShippingExceed: [],
        totalCost: []
      };

      resultTransaction.data.arrayOfOrder.forEach(x => {
        resultTransactionArray.created_at.push(x.created_at);
        resultTransactionArray.orderId.push(x.orderId);
        resultTransactionArray.totalBeforeDeduct.push(x.totalBeforeDeduct);
        resultTransactionArray.totalFeeName.push(x.totalFeeName);
        resultTransactionArray.totalPaidToSeller.push(x.totalPaidToSeller);
        resultTransactionArray.totalProduct.push(x.totalProduct);
        resultTransactionArray.totalProfitToSeller.push(x.totalProfitToSeller);
        resultTransactionArray.totalPromotionFlexi.push(x.totalPromotionFlexi);
        resultTransactionArray.totalPromotionVoucher.push(x.totalPromotionVoucher);
        resultTransactionArray.totalShippingByCust.push(x.totalShippingByCust);
        resultTransactionArray.totalShippingCharge.push(x.totalShippingCharge);
        resultTransactionArray.totalShippingExceed.push(
          (x.totalShippingByCust === 0 ? 45 : x.totalShippingByCust) +
            (x.totalShippingCharge === 0 ? -48.15 : x.totalShippingCharge)
        );
        resultTransactionArray.totalCost.push(
          x.totalPaidToSeller - x.totalProfitToSeller
        );
      });
      console.log("Total BeforeDeduct" ,resultTransactionArray.totalBeforeDeduct.reduce((a, b) => a + b, 0));
      console.log("Total Fee" ,resultTransactionArray.totalFeeName.reduce((a, b) => a + b, 0));
      console.log("Total PaidToSeller" ,resultTransactionArray.totalPaidToSeller.reduce((a, b) => a + b, 0));
      console.log("Total ProfitToSeller" ,resultTransactionArray.totalProfitToSeller.reduce((a, b) => a + b, 0));
      console.log("Total Flexi" ,resultTransactionArray.totalPromotionFlexi.reduce((a, b) => a + b, 0));
      console.log("Total Voucher" ,resultTransactionArray.totalPromotionVoucher.reduce((a, b) => a + b, 0));
      console.log("Total ByCust" ,resultTransactionArray.totalShippingByCust.reduce((a, b) => a + b, 0));
      console.log("Total Charge LAZ" ,resultTransactionArray.totalShippingCharge.reduce((a, b) => a + b, 0));
      console.log("Total Cost" ,resultTransactionArray.totalCost.reduce((a, b) => a + b, 0));

      // wideDeduct = resultTransactionArray.totalBeforeDeduct.reduce((a, b) => a + b, 0);
      // wideFee = resultTransactionArray.totalFeeName.reduce((a, b) => a + b, 0);
      // widePaidToSeller = resultTransactionArray.totalPaidToSeller.reduce((a, b) => a + b, 0);
      // wideProfitToSeller = resultTransactionArray.totalProfitToSeller.reduce((a, b) => a + b, 0);
      // wideFlexi = resultTransactionArray.totalPromotionFlexi.reduce((a, b) => a + b, 0);
      // wideVoucher = resultTransactionArray.totalPromotionVoucher.reduce((a, b) => a + b, 0);
      // wideShippingCust = resultTransactionArray.totalShippingByCust.reduce((a, b) => a + b, 0);
      // wideShippingCharge = resultTransactionArray.totalShippingCharge.reduce((a, b) => a + b, 0);
      // wideCost = resultTransactionArray.totalCost.reduce((a, b) => a + b, 0);

      let _resultWide = {
        wideDeduct : resultTransactionArray.totalBeforeDeduct.reduce((a, b) => a + b, 0),
        wideFee : resultTransactionArray.totalFeeName.reduce((a, b) => a + b, 0),
        widePaidToSeller : resultTransactionArray.totalPaidToSeller.reduce((a, b) => a + b, 0),
        wideProfitToSeller : resultTransactionArray.totalProfitToSeller.reduce((a, b) => a + b, 0),
        wideFlexi : resultTransactionArray.totalPromotionFlexi.reduce((a, b) => a + b, 0),
        wideVoucher : resultTransactionArray.totalPromotionVoucher.reduce((a, b) => a + b, 0),
        wideShippingCust : resultTransactionArray.totalShippingByCust.reduce((a, b) => a + b, 0),
        wideShippingCharge : resultTransactionArray.totalShippingCharge.reduce((a, b) => a + b, 0),
        wideCost :resultTransactionArray.totalCost.reduce((a, b) => a + b, 0)
      };

      await this.setState({
        resultTransactionArray: resultTransactionArray,
        resultTransaction: resultTransaction.data,
        resultWide : _resultWide,
        inventory: flattenTransactionProduct,
        inventoryCount: counts,
        isLoading: false
      });
    }


  };
  
  retryBlock = async() => {
    console.log("RETRY BLOCK");
    await this.setState({isLoading : "No available data. Retrying with DELIVERED order within 1 Week period."});
      setTimeout( async() => { 
        await this.setState(
          {
            startDateUserSelect: moment().add(-7, "days").startOf("day").format(),
            endDateUserSelect: moment().endOf("day").format(),
            statusOrder: "delivered",
          }
        );
        this.getData();
    }, 3000);
  }

	toggleDrawer = (side, open) => event => {
		console.log(side, open);
		if (
			event &&
			event.type === "keydown" &&
			(event.key === "Tab" || event.key === "Shift")
		) {
			return;
		}

		this.setState({ left: open });
	};

	sideList = side => (
		<div
			role="presentation"
			// onClick={this.toggleDrawer(side, false)}
			onKeyDown={this.toggleDrawer(side, false)}
			className="p-4"
		>
			<div className="d-flex flex-column justify-content-center align-items-center">
				<div className="d-flex justify-content-around flex-column">
					<MuiPickersUtilsProvider utils={DateFnsUtils}>
						<KeyboardDatePicker
							name="startDate"
							margin="normal"
							id="date-picker-dialog"
							label="Start Date (Before Date)"
							format="MM/dd/yyyy"
							value={this.state.startDateUserSelect}
							onChange={this.handleStartDate}
							KeyboardButtonProps={{
								"aria-label": "change date"
							}}
						/>

						<KeyboardDatePicker
							name="startDate"
							margin="normal"
							id="date-picker-dialog"
							label="End Date (After Date)"
							format="MM/dd/yyyy"
							value={this.state.endDateUserSelect}
							onChange={this.handleEndDate}
							KeyboardButtonProps={{
								"aria-label": "change date"
							}}
						/>
					</MuiPickersUtilsProvider>
				</div>
				<Divider />
				<div className="align-self-start my-5">
					<FormLabel component="legend">Status</FormLabel>
					<RadioGroup
						aria-label="statusSelected"
						name="statusSelected"
						value={this.state.statusOrder}
						onChange={e => this.setState({ statusOrder: e.target.value })}
					>
						<FormControlLabel
							value="delivered"
							control={<Radio />}
							label="Delivered"
						/>
						<FormControlLabel
							value="shipped"
							control={<Radio />}
							label="Shipped"
						/>
						<FormControlLabel
							value="canceled"
							control={<Radio />}
							label="Canceled"
						/>
						<FormControlLabel
							value="ready_to_ship"
							control={<Radio />}
							label="Ready to Ship"
						/>
					</RadioGroup>
				</div>
				<Button
					variant="contained"
					color="primary"
					fullWidth={true}
					onClick={() => {
						this.getData();
						this.toggleDrawer("left", false);
					}}
				>
					Submit
				</Button>
			</div>
		</div>
	);

	handleInputChange = event => {
		console.log(event);
		const target = event.target;
		const value = target.type === "checkbox" ? target.checked : target.value;
		const name = target.name;

		console.log(value);

		this.setState({
			[name]: value
		});
	};

	handleStartDate = e => {
		let value = moment(e)
			.startOf("day")
			.format();
		this.setState({ startDateUserSelect: value });
		console.log(value);
	};
	handleEndDate = e => {
		let value = moment(e)
			.endOf("day")
			.format();
		this.setState({ endDateUserSelect: value });
		console.log(value);
	};

	render() {
		if (this.state.isLoading) {
			return (
				<div className="container d-flex vh-100 justify-content-center">
					<div className="align-self-center align-items-center d-flex">
						<div>
							<CircularProgress />
						</div>
						<div className="px-3">
							<h4>{this.state.isLoading}</h4>
						</div>
					</div>
				</div>
			);
		}
		if (this.state.isLoading) {
			return <div>Loading</div>;
		}
		return (
			<div className="container">
				<Button onClick={this.toggleDrawer("left", true)}>Open Left</Button>

				<SwipeableDrawer
					open={this.state.left}
					onClose={this.toggleDrawer("left", false)}
					onOpen={this.toggleDrawer("left", true)}
				>
					{this.sideList("left")}
				</SwipeableDrawer>

				<div className="">
					<h2>Financial Statistic</h2>
					<div className="row d-flex justify-content-around">
						<List className="col-12 col-md-4">
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Revenue | ยอดขาย"
									secondary={
										this.state.resultWide.wideDeduct +
										" Baht"
									}
								/>
							</ListItem>
							<Divider />
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Cost | ต้นทุน"
									secondary={
										this.state.resultWide.wideCost + " Baht"
									}
								/>
							</ListItem>
							<Divider />
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Profit | กำไร"
									secondary={
										this.state.resultWide.wideProfitToSeller.toFixed(2) + " Baht"
									}
								/>
							</ListItem>
							<Divider />
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Profit Ratio | กำไร ต่อ ยอดขาย"
									secondary={
										(
											(this.state.resultWide.wideProfitToSeller /
												this.state.resultWide.wideDeduct) *
											100
										).toFixed(2) + "%"
									}
								/>
							</ListItem>
						</List>
						<List className="col-12 col-md-4">
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Order Count | จำนวน Order"
									secondary={
										this.state.resultTransaction.arrayOfOrder.length + " Orders"
									}
								/>
							</ListItem>
							<Divider />
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Item Sold | จำนวนสินค้าขาย"
									secondary={this.state.inventory.length + " Items"}
								/>
							</ListItem>
							<Divider />
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Discount | ลดราคา"
									secondary={
										this.state.resultWide.wideVoucher.toFixed(
											2
										) + " Baht"
									}
								/>
							</ListItem>
							<Divider />
							<ListItem alignItems="flex-start">
								<ListItemText
									primary="Top sell item | สินค้าขายมากสุด"
									// secondary={`${this.state.financeVar.mostSold.itemId} ${this.state.financeVar.mostSold.count} Items`}
									secondary={
										<Link
											href={
												this.state.inventoryCount[0].product.product_detail_url
											}
											target="_blank"
											variant="body2"
										>
											{`${this.state.inventoryCount[0].product.name} ${this.state.inventoryCount[0].value} Items`}
										</Link>
									}
								/>
							</ListItem>
						</List>
					</div>
				</div>
				<Divider />

				<LineChart resultData={this.state.resultTransactionArray} />
			</div>
		);
	}
}
