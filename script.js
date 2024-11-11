const fileInput = document.getElementById('csvFileInput');
const uploadButton = document.getElementById('uploadButton');
const output = document.getElementById('results');
const affiliateSelect = document.getElementById('affiliateSelect');

// Function to fetch affiliates and populate the dropdown
function fetchAffiliates() {
    const body = {
        "table": "AffiliatesApiTokensTable",
        "page": 1,
        "limit": 100,
        "filters": { "isActive": [true] },
        "order_values": {},
        "scope_values": {}
    };

    const headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "client-id": "195",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InV1aWQiOiIwODEzMDFjYS0zMmM2LTQwMTQtOGI0Ni1lMDgzYTQ1M2UwZDMiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXBXaGl0ZWxpc3RpbmdFbmFibGVkIjpmYWxzZSwiZW1haWwiOiJtYXRoZXVzLm1AaXJldi5jb20iLCJmaXJzdE5hbWUiOiJNYXRoZXVzIiwibGFzdE5hbWUiOiJCcnVubyBbU10iLCJtYXN0ZXJJZCI6MTI5MCwib3RwIjp0cnVlLCJ0ZWxlZ3JhbSI6Ijc0NjE2Njc4MDgiLCJyb2xlIjoiU3VwcG9ydCIsInRpbWV6b25lIjoiQW1lcmljYS9BcmdlbnRpbmEvQnVlbm9zX0FpcmVzIiwiZnJvbnRhcHBVc2VySGFzaCI6IjU2MGI3YzM4Y2Q0ZDE2ZjJkNjk0MDY2ZDA3OTc5YjBiMmVkMmQwMTZiNzc1ZDEwMWViZGFmYjdkMTBjZDJlY2EifSwiY2xpZW50SWQiOiIxOTUiLCJleHAiOjE3MzE0MTcwMTUsImlhdCI6MTczMTMzMDYxNX0.Co89On6MhAnx3OqquddGjxjVtzQwrACwAN_gTOrztO0"
    };

    fetch('https://demo-ldlt.irev.com/api/crm/v1/table/data', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('API response data:', data);
        if (data && data.rows) {
            console.log('Rows data:', data.rows);
            populateAffiliateDropdown(data.rows);
        } else {
            output.innerHTML = 'Error fetching affiliates: Invalid response from server.';
            console.error('Invalid response format:', data);
        }
    })
    .catch(error => {
        output.innerHTML = 'Error fetching affiliates: ' + error;
        console.error('Fetch error:', error);
    });
}

// Function to populate the affiliate dropdown
function populateAffiliateDropdown(affiliateRows) {
    console.log('populateAffiliateDropdown called with affiliateRows:', affiliateRows);
    if (!Array.isArray(affiliateRows) || affiliateRows.length === 0) {
        output.innerHTML = 'No affiliates found.';
        console.error('Affiliate rows is empty or not an array:', affiliateRows);
        return;
    }
    affiliateSelect.innerHTML = ''; // Clear existing options
    affiliateRows.forEach(row => {
        console.log('Processing row:', row);
        const option = document.createElement('option');
        option.value = row['token']; // Use token_value as the value
        option.text = row['name'];   // Display affiliate name
        affiliateSelect.add(option);
    });
}

// Call the function to fetch affiliates on page load
fetchAffiliates();

// Rest of your code remains the same...

uploadButton.addEventListener('click', function() {
    const file = fileInput.files[0];
    const selectedAffiliateToken = affiliateSelect.value;

    if (!selectedAffiliateToken) {
        output.innerHTML = 'Please select an affiliate.';
        return;
    }

    if (!file) {
        output.innerHTML = 'Please select a CSV file.';
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const leads = results.data;
            processLeads(leads, selectedAffiliateToken);
        },
        error: function(error) {
            output.innerHTML = 'Error parsing CSV file: ' + error.message;
        }
    });
});

function processLeads(leads, authToken) {
    const totalLeads = leads.length;
    let processedLeads = 0;
    output.innerHTML = `Processing ${totalLeads} leads...<br>`;
    leads.forEach((lead, index) => {
        postLead(lead, authToken)
            .then(response => {
                processedLeads++;
                output.innerHTML += `Lead ${index + 1} processed successfully.<br>`;
                if (processedLeads === totalLeads) {
                    output.innerHTML += 'All leads processed.';
                }
            })
            .catch(error => {
                processedLeads++;
                output.innerHTML += `Error processing lead ${index + 1}: ${error}<br>`;
                if (processedLeads === totalLeads) {
                    output.innerHTML += 'All leads processed.';
                }
            });
    });
}

function postLead(lead, authToken) {
    const ip = lead['UserIp'];
    const country_code = lead['Country'];
    const password = lead['Password'];
    const prefix = lead['Prefix'];
    const phone = lead['Phone'];
    const first_name = lead['FirstName'];
    const last_name = lead['LastName'];
    const email = lead['Email'];
    const language = lead['Language'];
    const offer_id = lead['Offer ID'];
    const affiliate_id = '2'; // Default value

    const payload = {
        "ip": ip,
        "country_code": country_code,
        "password": password,
        "phone": "+" + prefix + phone,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "language": language,
        "offer_id": offer_id,
        "affiliate_id": affiliate_id
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authToken
    };

    const url = 'https://demo-ldlt.irev.com/api/affiliates/v2/leads';

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Status: ${response.status} / Response: ${errorText}`);
        }
        return response.json();
    });
}
