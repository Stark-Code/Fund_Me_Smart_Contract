function printObj(obj) {
    str = JSON.stringify(obj)
    str = JSON.stringify(obj, null, 4) // (Optional) beautiful indented output.
    console.log(str)
}

module.exports = { printObj }
