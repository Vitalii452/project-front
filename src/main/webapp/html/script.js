
let currentPage = 0;
let pageSize = 3;
const fieldNames = ['id', 'name', 'title', 'race', 'profession', 'level', 'birthday', 'banned'];

const loadPage = () =>  {
    $("#mainTable tbody").empty();
    $.ajax({
        url: `rest/players?pageNumber=${currentPage}&pageSize=${pageSize}`,
        type: 'GET',
        dataType: 'json',
    })
    .done((data) => {
        data.forEach((character) => {
            const row = $("<tr></tr>");

            fieldNames.forEach((field) => {
                let value;
                const tdElement = $("<td></td>");

                if (field === 'birthday') {
                    value = new Date(character.birthday).toLocaleDateString();
                } else if(field === 'banned') {
                    value = character.banned ? "Yes" : "No";
                } else {
                    value = character[field];
                }
                tdElement.text(value).attr('data-name', `${field}`);
                row.append(tdElement);
            })

            row.append($("<td></td>").append($("<img>").attr({src: "/img/edit.svg", "data-id": character.id}).addClass("edit-btn")));
            row.append($("<td></td>").append($("<img>").attr({src: "/img/delete.svg", "data-id": character.id}).addClass("delete-btn")));

            $("#mainTable tbody").append(row);

        })
    })
        .fail((jqXHR) => {
            console.error("Error status: ", jqXHR.status);
            console.error("Error statusText: ", jqXHR.statusText);
        })
}

const creatingPagingButtons = (totalPages) => {
    $("#pagingButtons").empty();
    for (let i = 1; i <= totalPages; i++) {
        $("#pagingButtons").append($("<button>").text(i).click(function() {
            $("#pagingButtons button").removeClass("current-page");
            currentPage = i - 1;
            $(this).addClass("current-page");
            loadPage();
        }))
    }
}

const updatePagingAndLoad = () => {
    $.get("/rest/players/count", (totalCount) => {
        const totalPages =  Math.ceil(totalCount / pageSize);
        creatingPagingButtons(totalPages);
        loadPage();
    })
}

$("#pageSizeSelector").change(function () {
    pageSize = $(this).val();
    currentPage = 0;
    updatePagingAndLoad();
})

$(document).on("click", ".delete-btn", function () {
   const characterId = $(this).attr("data-id");
    $.ajax({
        url: `/rest/players/${characterId}`,
        type: "DELETE"
    }).done(loadPage);
})

$(document).on("click", ".edit-btn", function () {
    const row = $(this).closest('tr');
    replaceEditAndDeleteIcons(row);

    row.find('td').each(function (index, td) {
        const currentText = $(td).text();
        const dataName = $(td).data('name');
        let fieldName = fieldNames[index];
        let elementTemplate;

        if (dataName === 'banned') {
            elementTemplate = `<input type="checkbox" name="${fieldName}" ${currentText.toLowerCase() === 'yes' ? 'checked' : ''}/>`;
        } else if (dataName === 'race') {
            elementTemplate = `
                <select name="${fieldName}">
                    <option value="HUMAN" ${currentText === 'HUMAN' ? 'selected' : ''}>HUMAN</option>
                    <option value="DWARF" ${currentText === 'DWARF' ? 'selected' : ''}>DWARF</option>
                    <option value="ELF" ${currentText === 'ELF' ? 'selected' : ''}>ELF</option>
                    <option value="GIANT" ${currentText === 'GIANT' ? 'selected' : ''}>GIANT</option>
                    <option value="ORC" ${currentText === 'ORC' ? 'selected' : ''}>ORC</option>
                    <option value="TROLL" ${currentText === 'TROLL' ? 'selected' : ''}>TROLL</option>
                    <option value="HOBBIT" ${currentText === 'HOBBIT' ? 'selected' : ''}>HOBBIT</option>
                </select>
            `;
        } else if (dataName === 'profession') {
            elementTemplate = `
                <select name="${fieldName}">
                    <option value="WARRIOR" ${currentText === 'WARRIOR' ? 'selected' : ''}>WARRIOR</option>
                    <option value="ROGUE" ${currentText === 'ROGUE' ? 'selected' : ''}>ROGUE</option>
                    <option value="SORCERER" ${currentText === 'SORCERER' ? 'selected' : ''}>SORCERER</option>
                    <option value="CLERIC" ${currentText === 'CLERIC' ? 'selected' : ''}>CLERIC</option>
                    <option value="PALADIN" ${currentText === 'PALADIN' ? 'selected' : ''}>PALADIN</option>
                    <option value="NAZGUL" ${currentText === 'NAZGUL' ? 'selected' : ''}>NAZGUL</option>
                    <option value="WARLOCK" ${currentText === 'WARLOCK' ? 'selected' : ''}>WARLOCK</option>
                    <option value="DRUID" ${currentText === 'DRUID' ? 'selected' : ''}>DRUID</option>
                </select>
            `;
        } else {
            elementTemplate = `<input type="text" name="${fieldName}" value="${currentText}"/>`;
        }

        if (index > 0 && index < 8 && index !== 5 && index !== 6) {
            $(td).html(elementTemplate);
        }
    })
})

function replaceEditAndDeleteIcons(row) {
    const editBtn = row.find('.edit-btn');
    const deleteBtn = row.find('.delete-btn');

    editBtn.removeClass('edit-btn').addClass('done-btn');
    editBtn.attr('src', '/img/done.svg');

    deleteBtn.removeClass('delete-btn').addClass('close-btn');
    deleteBtn.attr('src', '/img/close.svg');
}

$(document).on('click', '.close-btn',() => {
    loadPage();
})

$(document).on('click', '.done-btn', function () {
    const row = $(this).closest('tr');
    const newPerson = {};
    const id = $(this).data('id');

    const excludedFields = ['level', 'birthday', 'id'];

    fieldNames.forEach((field) => {
        if (!excludedFields.includes(field)) {
            const td = row.find(`td[data-name=${field}]`);
            const inputOrSelectElement = td.find('input, select');
            let value;

            if (inputOrSelectElement.length > 0) {
                value = (field === 'banned') ? inputOrSelectElement.is(':checked') : inputOrSelectElement.val();
            } else {
                value = td.text();
            }

            newPerson[field] = value;
        }
    })

    console.log(newPerson);

    const dataToSend = JSON.stringify(newPerson);

    $.ajax({
        url: `/rest/players/${id}`,
        type: 'POST',
        contentType: 'application/json',
        data: dataToSend,
    })
        .done(() => {
            loadPage();
        })
        .fail((jqXHR) => {
            console.error("Error status: ", jqXHR.status);
            console.error("Error responseText: ", jqXHR.responseText);
            console.error("Error statusText: ", jqXHR.statusText);
        })
})
$(document).on('click', '#create-account-button', function() {
    handleCreateAccount();
});
function handleCreateAccount() {
    const data = {
        name: $('input[name="newName"]').val(),
        title: $('input[name="newTitle"]').val(),
        race: $('select[name="newRace"]').val(),
        profession: $('select[name="newProfession"]').val(),
        level: parseInt($('input[name="newLevel"]').val(), 10),
        birthday: new Date($('input[name="newBirthday"]').val()).getTime(),
        banned: $('input[name="newBanned"]').is(':checked')
    }
    const dataToSend = JSON.stringify(data);
    console.log(dataToSend);
    $.ajax({
        url: '/rest/players',
        type: 'POST',
        contentType: 'application/json',
        data: dataToSend,
    }).done(() => {
        $('.create-account-form input, .create-account-form select').val('');
        loadPage();
    })
        .fail((jqXHR) => {
            console.error("Error status: ", jqXHR.status);
            console.error("Error responseText: ", jqXHR.responseText);
            console.error("Error statusText: ", jqXHR.statusText);
        })
}



document.addEventListener('input', function(e) {
    if (e.target.closest('td[data-name]')) {
        const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        e.target.setAttribute('value', newValue);
    }
})

updatePagingAndLoad();

