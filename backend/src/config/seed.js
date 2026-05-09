const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Station = require('../models/Station');
const Service = require('../models/Service');
const SparePart = require('../models/SparePart');

const DEF_STATIONS = [
  {stationId:'ST001',name:'Kalavasal EV Hub',type:'fast-dc',typeName:'Fast DC',location:'Kalavasal, Madurai',distance:1.2,totalSlots:8,availableSlots:5,power:50,pricePerKwh:16,rating:4.8,lat:9.9250,lng:78.0950,status:'available',contact:'04522350001'},
  {stationId:'ST002',name:'Periyar Charge Point',type:'normal-ac',typeName:'Normal AC',location:'Periyar Bus Stand, Madurai',distance:2.1,totalSlots:10,availableSlots:2,power:22,pricePerKwh:12,rating:4.5,lat:9.9168,lng:78.1195,status:'limited',contact:'04522350002'},
  {stationId:'ST003',name:'Mattuthavani Power Station',type:'fast-dc',typeName:'Fast DC',location:'Mattuthavani Bus Stand, Madurai',distance:4.8,totalSlots:12,availableSlots:9,power:60,pricePerKwh:18,rating:4.7,lat:9.9425,lng:78.1140,status:'available',contact:'04522350003'},
  {stationId:'ST004',name:'Goripalayam EV Point',type:'normal-ac',typeName:'Normal AC',location:'Goripalayam, Madurai',distance:1.5,totalSlots:6,availableSlots:0,power:22,pricePerKwh:14,rating:4.6,lat:9.9210,lng:78.1085,status:'full',contact:'04522350004'},
  {stationId:'ST005',name:'Anna Nagar Green Charge',type:'fast-dc',typeName:'Fast DC',location:'Anna Nagar, Madurai',distance:3.2,totalSlots:8,availableSlots:6,power:50,pricePerKwh:15,rating:4.9,lat:9.9450,lng:78.1250,status:'available',contact:'04522350005'},
  {stationId:'ST006',name:'Teppakulam Bike Zone',type:'bike',typeName:'Bike Charging',location:'Teppakulam, Madurai',distance:0.8,totalSlots:20,availableSlots:14,power:3,pricePerKwh:6,rating:4.4,lat:9.9195,lng:78.1165,status:'available',contact:'04522350006'},
  {stationId:'ST007',name:'Thiruparankundram EV Plaza',type:'fast-dc',typeName:'Fast DC',location:'Thiruparankundram, Madurai',distance:5.5,totalSlots:10,availableSlots:1,power:120,pricePerKwh:22,rating:4.8,lat:9.8780,lng:78.0690,status:'limited',contact:'04522350007'},
  {stationId:'ST008',name:'Villapuram Charge Hub',type:'normal-ac',typeName:'Normal AC',location:'Villapuram, Madurai',distance:4.0,totalSlots:8,availableSlots:5,power:22,pricePerKwh:11,rating:4.3,lat:9.9520,lng:78.0830,status:'available',contact:'04522350008'},
  {stationId:'ST009',name:'Arapalayam Quick Charge',type:'fast-dc',typeName:'Fast DC',location:'Arapalayam, Madurai',distance:2.8,totalSlots:6,availableSlots:4,power:50,pricePerKwh:17,rating:4.6,lat:9.9340,lng:78.0980,status:'available',contact:'04522350009'},
  {stationId:'ST010',name:'Kochadai Bike Pitstop',type:'bike',typeName:'Bike Charging',location:'Kochadai, Madurai',distance:5.0,totalSlots:16,availableSlots:12,power:3,pricePerKwh:5,rating:4.5,lat:9.9580,lng:78.0720,status:'available',contact:'04522350010'},
  {stationId:'ST011',name:'KK Nagar Power Station',type:'fast-dc',typeName:'Fast DC',location:'KK Nagar, Madurai',distance:3.5,totalSlots:10,availableSlots:7,power:60,pricePerKwh:19,rating:4.7,lat:9.9480,lng:78.1350,status:'available',contact:'04522350011'},
  {stationId:'ST012',name:'Alagappan Nagar EV Spot',type:'normal-ac',typeName:'Normal AC',location:'Alagappan Nagar, Madurai',distance:4.2,totalSlots:8,availableSlots:3,power:15,pricePerKwh:10,rating:4.4,lat:9.9550,lng:78.1420,status:'limited',contact:'04522350012'},
  {stationId:'ST013',name:'Simmakal Charge Center',type:'normal-ac',typeName:'Normal AC',location:'Simmakal, Madurai',distance:1.0,totalSlots:10,availableSlots:8,power:22,pricePerKwh:13,rating:4.6,lat:9.9285,lng:78.1020,status:'available',contact:'04522350013'},
  {stationId:'ST014',name:'Tallakulam EV Station',type:'fast-dc',typeName:'Fast DC',location:'Tallakulam, Madurai',distance:2.5,totalSlots:6,availableSlots:2,power:50,pricePerKwh:18,rating:4.5,lat:9.9310,lng:78.1280,status:'limited',contact:'04522350014'},
  {stationId:'ST015',name:'SS Colony Bike Charge',type:'bike',typeName:'Bike Charging',location:'SS Colony, Madurai',distance:3.8,totalSlots:14,availableSlots:10,power:3,pricePerKwh:7,rating:4.3,lat:9.9070,lng:78.0870,status:'available',contact:'04522350015'},
  {stationId:'ST016',name:'Avaniyapuram Green Hub',type:'normal-ac',typeName:'Normal AC',location:'Avaniyapuram, Madurai',distance:6.0,totalSlots:8,availableSlots:6,power:22,pricePerKwh:11,rating:4.2,lat:9.8960,lng:78.1350,status:'available',contact:'04522350016'},
  {stationId:'ST017',name:'Iyer Bungalow Fast Charge',type:'fast-dc',typeName:'Fast DC',location:'Iyer Bungalow, Madurai',distance:2.0,totalSlots:6,availableSlots:4,power:50,pricePerKwh:16,rating:4.8,lat:9.9380,lng:78.1090,status:'available',contact:'04522350017'},
  {stationId:'ST018',name:'Othakadai EV Point',type:'normal-ac',typeName:'Normal AC',location:'Othakadai, Madurai',distance:7.2,totalSlots:8,availableSlots:5,power:22,pricePerKwh:10,rating:4.4,lat:9.9650,lng:78.0650,status:'available',contact:'04522350018'},
  {stationId:'ST019',name:'Tirumangalam Road SuperCharger',type:'fast-dc',typeName:'Fast DC',location:'Tirumangalam Road, Madurai',distance:8.5,totalSlots:10,availableSlots:8,power:120,pricePerKwh:24,rating:4.9,lat:9.8250,lng:77.9860,status:'available',contact:'04522350019'},
  {stationId:'ST021',name:'Madurai Central Power Station',type:'fast-dc',typeName:'Fast DC',location:'Central Madurai',distance:0.5,totalSlots:10,availableSlots:8,power:100,pricePerKwh:20,rating:4.9,lat:9.9250,lng:78.1150,status:'available',contact:'04522350021'}
];

const DEF_WORKERS = [
  {name:'Murugan K',phone:'9876543210',email:'murugan@voltreserve.com',specialization:'bike',skills:['Battery','Motor','Wiring'],rating:4.8,lat:9.9220,lng:78.0980,earnings:18400},
  {name:'Senthil Kumar',phone:'9876543211',email:'senthil@voltreserve.com',specialization:'car',skills:['Motor','Brakes','Suspension'],rating:4.5,lat:9.9380,lng:78.1120,earnings:22100},
  {name:'Ravi Chandran',phone:'9876543212',email:'ravi@voltreserve.com',specialization:'both',skills:['Battery','Tyre','General'],rating:4.9,lat:9.9100,lng:78.0900,earnings:31200},
  {name:'Lakshmi Priya',phone:'9876543213',email:'lakshmi@voltreserve.com',specialization:'bike',skills:['Controller','BMS','Diagnostics'],rating:4.7,lat:9.9450,lng:78.1300,earnings:16800},
  {name:'Karthik Raja',phone:'9876543214',email:'karthik@voltreserve.com',specialization:'car',skills:['Battery Pack','Charging System'],rating:4.6,lat:9.8800,lng:78.0750,earnings:28900},
  {name:'Deepan S',phone:'9876543215',email:'deepan@voltreserve.com',specialization:'both',skills:['General','Tyre','Brake'],rating:4.4,lat:9.9550,lng:78.0800,earnings:14200},
  {name:'Saravanan M',phone:'9876543216',email:'saravanan@voltreserve.com',specialization:'bike',skills:['Motor Rewinding','Wiring'],rating:4.8,lat:9.9300,lng:78.1050,earnings:19600},
  {name:'Arun Prakash',phone:'9876543217',email:'arun@voltreserve.com',specialization:'car',skills:['HV Battery','BMS Reset'],rating:5.0,lat:9.9180,lng:78.1200,earnings:38000}
];

const DEF_SERVICES = [
  {name:'Battery Health Check',category:'battery',description:'Complete BMS scan, cell voltage check, capacity test & battery health report for your EV.',price:299,estimatedTime:'30–45 min',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],icon:'fa-battery-half'},
  {name:'Battery Pack Replacement',category:'battery',description:'Full battery pack replacement with new lithium-ion cells and BMS configuration.',price:15000,estimatedTime:'2–4 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler'],icon:'fa-battery-full'},
  {name:'BMS Reset & Calibration',category:'battery',description:'Battery Management System reset, firmware update and calibration.',price:599,estimatedTime:'1–2 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck'],icon:'fa-microchip'},
  {name:'Motor Inspection & Service',category:'motor',description:'Motor inspection, bearing check, winding test, cleaning & performance optimization.',price:499,estimatedTime:'1–2 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],icon:'fa-gear'},
  {name:'Motor Rewinding',category:'motor',description:'Complete motor rewinding service for damaged or burnt out motor coils.',price:3500,estimatedTime:'4–6 hrs',vehicleTypesSupported:['ev-bike','ev-3wheeler'],icon:'fa-gears'},
  {name:'Hub Motor Replacement',category:'motor',description:'Hub motor removal and replacement with genuine parts.',price:5500,estimatedTime:'2–3 hrs',vehicleTypesSupported:['ev-bike','ev-3wheeler'],icon:'fa-circle-dot'},
  {name:'Controller Diagnostics',category:'controller',description:'ECU/Controller diagnostics, error code reading and performance analysis.',price:399,estimatedTime:'45–60 min',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],icon:'fa-microchip'},
  {name:'Controller Replacement',category:'controller',description:'Faulty controller replacement with compatible unit and programming.',price:3000,estimatedTime:'1–2 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler'],icon:'fa-memory'},
  {name:'Brake Pad Replacement',category:'brake-suspension',description:'Front and rear brake pad inspection and replacement service.',price:450,estimatedTime:'30–45 min',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck'],icon:'fa-brake-warning'},
  {name:'Suspension Service',category:'brake-suspension',description:'Shock absorber check, replacement and suspension alignment.',price:800,estimatedTime:'1–2 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler'],icon:'fa-arrows-up-down'},
  {name:'Tyre Replacement',category:'tyre-wheel',description:'Tyre removal, fitting, balancing and alignment service.',price:399,estimatedTime:'30–60 min',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck'],icon:'fa-circle'},
  {name:'Wheel Bearing Service',category:'tyre-wheel',description:'Wheel bearing inspection, greasing and replacement if needed.',price:350,estimatedTime:'45 min',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler'],icon:'fa-circle-dot'},
  {name:'Charging Port Repair',category:'charging-port',description:'Charging socket inspection, pin repair, connector replacement.',price:599,estimatedTime:'1–2 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],icon:'fa-plug'},
  {name:'Onboard Charger Repair',category:'charging-port',description:'Onboard charger circuit diagnosis and component-level repair.',price:1200,estimatedTime:'2–3 hrs',vehicleTypesSupported:['ev-car','ev-bus-truck'],icon:'fa-charging-station'},
  {name:'Wiring Harness Repair',category:'wiring-fuse',description:'Complete wiring harness inspection, repair and soldering.',price:699,estimatedTime:'1–3 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],icon:'fa-code-branch'},
  {name:'Fuse Box Repair',category:'wiring-fuse',description:'Fuse box inspection, blown fuse replacement and circuit testing.',price:250,estimatedTime:'30–45 min',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck'],icon:'fa-bolt'},
  {name:'Full EV Service',category:'full-servicing',description:'Complete EV checkup: battery, motor, brakes, tyres, controller, wiring & cleaning.',price:1499,estimatedTime:'3–5 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],icon:'fa-car-side'},
  {name:'Pre-Purchase Inspection',category:'full-servicing',description:'Comprehensive inspection report for used EV purchases.',price:999,estimatedTime:'2–3 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler'],icon:'fa-clipboard-check'},
  {name:'Emergency Roadside Repair',category:'roadside-assistance',description:'Emergency on-site repair for breakdown, flat tyre, battery issues.',price:799,estimatedTime:'1–3 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],icon:'fa-screwdriver-wrench'},
  {name:'EV Towing Service',category:'roadside-assistance',description:'Professional EV towing to nearest service center.',price:1200,estimatedTime:'1–2 hrs',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck'],icon:'fa-truck-pickup'}
];

const DEF_SPARE_PARTS = [
  {partName:'Lithium Battery Pack 48V 30Ah',description:'High-capacity lithium-ion battery pack for EV bikes and 3-wheelers. 2000+ charge cycles.',category:'battery',vehicleTypesSupported:['ev-bike','ev-3wheeler'],price:25000,stock:5,warranty:'2 Years',discount:0},
  {partName:'Lithium Battery Pack 72V 40Ah',description:'Premium battery pack for EV cars. Fast charging compatible.',category:'battery',vehicleTypesSupported:['ev-car'],price:45000,stock:3,warranty:'3 Years',discount:5},
  {partName:'Battery BMS Module 13S',description:'13-cell Battery Management System with balancing, protection circuits.',category:'battery',vehicleTypesSupported:['ev-bike','ev-3wheeler','other'],price:1800,stock:12,warranty:'1 Year',discount:0},
  {partName:'Battery BMS Module 20S',description:'20-cell BMS for 72V EV car battery packs with CAN bus.',category:'battery',vehicleTypesSupported:['ev-car','ev-bus-truck'],price:3500,stock:8,warranty:'1 Year',discount:0},
  {partName:'BLDC Hub Motor 1000W',description:'Brushless DC hub motor 1000W for EV bikes. High torque, silent operation.',category:'motor',vehicleTypesSupported:['ev-bike'],price:8500,stock:6,warranty:'1 Year',discount:0},
  {partName:'BLDC Motor 3000W',description:'High-power 3000W BLDC motor for EV cars and commercial vehicles.',category:'motor',vehicleTypesSupported:['ev-car','ev-3wheeler','ev-bus-truck'],price:18000,stock:3,warranty:'2 Years',discount:10},
  {partName:'Controller Unit 48V 30A',description:'Programmable sine-wave controller for smooth acceleration.',category:'controller',vehicleTypesSupported:['ev-bike','ev-3wheeler'],price:3000,stock:10,warranty:'1 Year',discount:0},
  {partName:'Controller Unit 72V 80A',description:'High-current controller for EV cars with regenerative braking.',category:'controller',vehicleTypesSupported:['ev-car','ev-bus-truck'],price:7500,stock:4,warranty:'1 Year',discount:0},
  {partName:'DC-DC Converter 48V to 12V',description:'Step-down converter for powering 12V accessories from main battery.',category:'controller',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],price:2200,stock:15,warranty:'6 Months',discount:0},
  {partName:'Charging Socket Type 2',description:'IEC 62196 Type 2 charging socket for AC charging.',category:'charging',vehicleTypesSupported:['ev-car','ev-bus-truck'],price:1500,stock:20,warranty:'6 Months',discount:0},
  {partName:'Charging Socket 3-Pin',description:'Standard 3-pin charging socket for EV bikes and scooters.',category:'charging',vehicleTypesSupported:['ev-bike','ev-3wheeler'],price:450,stock:25,warranty:'6 Months',discount:0},
  {partName:'Wiring Harness Complete',description:'Complete replacement wiring harness with connectors.',category:'wiring',vehicleTypesSupported:['ev-bike','ev-3wheeler'],price:1500,stock:8,warranty:'6 Months',discount:0},
  {partName:'Fuse Kit (Set of 10)',description:'Assorted fuse kit with blade fuses for EV circuits.',category:'wiring',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],price:250,stock:30,warranty:'N/A',discount:0},
  {partName:'Brake Pads Set (Front+Rear)',description:'High-performance ceramic brake pads for EV vehicles.',category:'brake',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler'],price:450,stock:20,warranty:'6 Months',discount:0},
  {partName:'EV Tyre 90/90-12',description:'Tubeless tyre optimized for electric vehicle weight distribution.',category:'tyre',vehicleTypesSupported:['ev-bike','ev-3wheeler'],price:1200,stock:15,warranty:'1 Year',discount:0},
  {partName:'EV Tyre 185/65R15',description:'Low rolling resistance car tyre for maximum EV range.',category:'tyre',vehicleTypesSupported:['ev-car'],price:3500,stock:8,warranty:'2 Years',discount:5},
  {partName:'LCD Display Panel',description:'Color LCD speedometer display with battery, speed, trip info.',category:'display',vehicleTypesSupported:['ev-bike','ev-3wheeler'],price:2800,stock:10,warranty:'1 Year',discount:0},
  {partName:'Throttle Assembly',description:'Hall-effect twist/thumb throttle with smooth response curve.',category:'sensor',vehicleTypesSupported:['ev-bike','ev-3wheeler'],price:350,stock:18,warranty:'6 Months',discount:0},
  {partName:'Speed Sensor Kit',description:'Magnetic speed sensor with magnet ring and mounting hardware.',category:'sensor',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck'],price:280,stock:22,warranty:'6 Months',discount:0},
  {partName:'Hall Effect Sensor Set (3pcs)',description:'Motor position sensors for BLDC motor commutation.',category:'sensor',vehicleTypesSupported:['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'],price:350,stock:25,warranty:'6 Months',discount:0}
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Check if already seeded
    const stationCount = await Station.countDocuments();
    if (stationCount > 0) {
      // Insert new stations if they don't exist
      for (const s of DEF_STATIONS) {
        const exists = await Station.findOne({ stationId: s.stationId });
        if (!exists) {
          await Station.create({
            ...s,
            reviews: [
              { name: 'Arjun K.', rating: s.rating, comment: 'Great charging speed!' },
              { name: 'Priya M.', rating: s.rating - 0.1, comment: 'Convenient location, well-maintained.' },
              { name: 'Vikram S.', rating: s.rating + 0.05, comment: 'Fast and reliable.' },
              { name: 'Neha R.', rating: s.rating - 0.05, comment: 'Excellent service, always available!' }
            ]
          });
          console.log(`✅ Added new station: ${s.name}`);
        }
      }
    } else {
      // Seed stations
      await Station.insertMany(DEF_STATIONS.map(s => ({
        ...s,
        reviews: [
          { name: 'Arjun K.', rating: s.rating, comment: 'Great charging speed!' },
          { name: 'Priya M.', rating: s.rating - 0.1, comment: 'Convenient location, well-maintained.' },
          { name: 'Vikram S.', rating: s.rating + 0.05, comment: 'Fast and reliable.' },
          { name: 'Neha R.', rating: s.rating - 0.05, comment: 'Excellent service, always available!' }
        ]
      })));
      console.log('✅ Seeded stations');
    }

    // Seed admin user
    const adminExists = await User.findOne({ email: 'admin@ev.com' });
    if (!adminExists) {
      const hashedAdminPass = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@ev.com',
        passwordHash: hashedAdminPass,
        role: 'admin',
        walletBalance: 10000
      });
      console.log('✅ Seeded admin user (admin@ev.com / admin123)');
    }

    // Seed test user
    const testEmail = 'kajendranking25@gmail.com';
    const hashedTestPass = await bcrypt.hash('25282004', 10);
    await User.findOneAndUpdate(
      { email: testEmail },
      {
        name: 'Kajend Ranking',
        email: testEmail,
        passwordHash: hashedTestPass,
        role: 'customer',
        walletBalance: 500
      },
      { upsert: true }
    );
    console.log('✅ Seeded/updated test user (' + testEmail + ' / 25282004)');

    // Seed technician users
    for (const w of DEF_WORKERS) {
      const workerExists = await User.findOne({ email: w.email });
      if (!workerExists) {
        const hashedTechPass = await bcrypt.hash('tech123', 10);
        await User.create({
          name: w.name,
          email: w.email,
          phone: w.phone,
          passwordHash: hashedTechPass,
          role: 'technician',
          walletBalance: w.earnings,
          location: { lat: w.lat, lng: w.lng }
        });
      }
    }
    console.log('✅ Seeded technicians');

    // Seed services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany(DEF_SERVICES);
      console.log('✅ Seeded ' + DEF_SERVICES.length + ' services');
    } else {
      console.log('Services already seeded (' + serviceCount + ')');
    }

    // Seed spare parts
    const partCount = await SparePart.countDocuments();
    if (partCount === 0) {
      await SparePart.insertMany(DEF_SPARE_PARTS);
      console.log('✅ Seeded ' + DEF_SPARE_PARTS.length + ' spare parts');
    } else {
      console.log('Spare parts already seeded (' + partCount + ')');
    }

    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    // Always ensure test user exists
    try {
      const testEmail = 'kajendranking25@gmail.com';
      const hashedTestPass = await bcrypt.hash('25282004', 10);
      await User.findOneAndUpdate(
        { email: testEmail },
        {
          name: 'Kajend Ranking',
          email: testEmail,
          passwordHash: hashedTestPass,
          role: 'customer',
          walletBalance: 500
        },
        { upsert: true }
      );
      console.log('✅ Test user ready (' + testEmail + ' / 25282004)');
    } catch (err) {
      console.error('Error setting up test user:', err.message);
    }
  }
};

module.exports = { seedDB, DEF_STATIONS, DEF_WORKERS };

// Run directly
if (require.main === module) {
  seedDB().then(() => process.exit(0));
}
