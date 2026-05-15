function EmptyTableRow({ colSpan, message }) {
    return (
        <tr>
            <td colSpan={colSpan} className="empty-table-cell">
                {message}
            </td>
        </tr>
    );
}

export default EmptyTableRow;