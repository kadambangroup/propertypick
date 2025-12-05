const CITIES = [
    "Bangalore",
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Erode",
    "Vellore",
    "Thoothukudi",
    "Dindigul",
    "Thanjavur",
    "Ranipet",
    "Sivakasi",
    "Karur",
    "Ooty",
    "Hosur",
    "Nagercoil",
    "Kanchipuram",
    "Kumarapalayam",
    "Karaikudi",
    "Neyveli",
    "Cuddalore",
    "Kumbakonam",
    "Tiruvannamalai",
    "Pollachi",
    "Rajapalayam",
    "Gudiyatham",
    "Pudukkottai",
    "Vaniyambadi",
    "Ambur",
    "Nagapattinam"
];

const PINCODES = [
    "600001", "600002", "600003", "600004", // Chennai samples
    "560001", "560002", "560003", // Bangalore samples
    "641001", "641002", // Coimbatore
    "625001" // Madurai
];

// Mock Listings Generator
function generateListings(count) {
    const types = ["Apartment", "Villa", "Plot", "Independent House"];
    const statuses = ["Buy", "Rent"];
    const listings = [];

    for (let i = 1; i <= count; i++) {
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const price = status === "Buy" 
            ? (Math.floor(Math.random() * 900) + 20) + " Lakhs"
            : (Math.floor(Math.random() * 50) + 5) + " K/mo";
        
        listings.push({
            id: i,
            title: `${Math.floor(Math.random() * 4 + 1)}BHK ${type} in ${city}`,
            price: price,
            location: city,
            pincode: PINCODES[Math.floor(Math.random() * PINCODES.length)],
            type: type,
            status: status,
            beds: Math.floor(Math.random() * 4 + 1),
            baths: Math.floor(Math.random() * 3 + 1),
            sqft: Math.floor(Math.random() * 2000 + 800),
            image: `https://source.unsplash.com/random/400x300/?house,apartment,${i}` // Using Unsplash source for random images
        });
    }
    return listings;
}

// Initial Data
const MOCK_LISTINGS = generateListings(50);
