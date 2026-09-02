export function houseTypeName(source, fallback = 'Loại Phòng') {
  if (!source) return fallback

  const explicitName =
    source.roomTypeName ||
    source.houseTypeName ||
    source.typeName ||
    source.name ||
    source.roomType?.name ||
    source.room?.roomType?.name ||
    source.bookingDetail?.roomType?.name

  if (explicitName && String(explicitName).trim() !== '') {
    return String(explicitName).trim()
  }

  const id = source.roomTypeId ?? source.typeId ?? source.id
  if (id !== undefined && id !== null && String(id).trim() !== '') {
    return `Loại Phòng ${id}`
  }

  return fallback
}
