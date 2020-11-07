// Due to me testing this using the local filesystem, I have to do this hack.

function workerFunction() {
    self.onmessage = (msg) => {
        const reader = new FileReader();
        const settings = msg.data[1];
        reader.readAsText(msg.data[0]);
        reader.onload = () => {
            const voters = reader.result;
            parse(voters, settings);
        }
    }
    // Parse the voter data.
    // This makes sure to only load each line at once to avoid using too much memory.
    function parse(voters, settings) {
        console.log('Finished');
        self.postMessage(['finished']);
        const regex = /(.*?)(\n|,)/y;
        function readLine() {
            const res = [];
            let out;
            do {
                out = regex.exec(voters);
                res.push(out[1]);
            } while (out[2] !== '\n');
            return res;
        }
        const headers = readLine();
        const dateOfBirthIndex = headers.indexOf('Date of Birth');
        const partyIndex = headers.indexOf('Applicant Party Designation');
        const registerYearIndex = headers.indexOf('Application Approved Date');
        headers.unshift('header');
        self.postMessage(headers);
        const partyMapping = {
            'D': 'Democrat',
            'R': 'Republican',
            'O': 'Other',
        }
        const partyUnusualTotals = {
            'D': 0,
            'R': 0,
            'O': 0,
        }
        const partyTotals = {
            'D': 0,
            'R': 0,
            'O': 0,
        }
        const ELECTION_YEAR = 2020;
        const yearOfRegistration = {};
        // This adds one to the totals sorted by party counter that is passed in as obj (with party name).
        function addTotal(obj, name) {
            if (!(name in obj)) {
                obj['O']++;
            } else {
                obj[name]++;
            }
        }
        try {
            while (true) {
                const line = readLine();
                const yearDifference = ELECTION_YEAR - new Date(line[dateOfBirthIndex]).getFullYear();
                // The reason some birth dates will display as 1/1/1800 is
                // due to confidentiality reasons of the registered votes.
                // (According to the pennsylvania dataset)
                if (yearDifference > settings.tolerance && ! line[dateOfBirthIndex].includes('1800')) {
                    addTotal(partyUnusualTotals, line[partyIndex]);
                    const registerDate = new Date(line[registerYearIndex]).getFullYear();
                    if (!yearOfRegistration[registerDate]) {
                        yearOfRegistration[registerDate] = 0;
                    }
                    yearOfRegistration[registerDate]++;
                    line.unshift('out_of_tolerance');
                    self.postMessage(line);
                }
                addTotal(partyTotals, line[partyIndex]);
            }
        } catch(e) {
            if (!e.message.includes(`Cannot read property '1' of null`)) {
                console.log(e);
            }
            // This Error is expected to be:
            // | Uncaught TypeError: Cannot read property '1' of null.
            // This optimization reduces the amount of if statements within readLine by one.
        }
        function addNamesToTotals(totals) {
            // Obvious code.
            return Object.entries(totals).map(x => [partyMapping[x[0]], x[1]]).reduce((result, current) => {
                result[current[0]] = current[1];
                return result;
            }, {})
        }
        self.postMessage([
            'finished_parsing',
            addNamesToTotals(partyTotals),
            addNamesToTotals(partyUnusualTotals),
            yearOfRegistration,
        ]);
    }
}
