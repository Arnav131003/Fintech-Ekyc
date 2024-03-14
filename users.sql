--Creating a database
CREATE DATABASE MyDatabase;
use MyDatabase;

-- Users Table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fname` varchar(255) DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `houseNr` varchar(255) DEFAULT NULL,
  `postCode` int(11) DEFAULT NULL,
  `placeOfRes` varchar(255) DEFAULT NULL,
  `dateOfBirth` varchar(255) DEFAULT NULL,
  `nat` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobNr` varchar(255) DEFAULT NULL,
  `ID1` varchar(255) DEFAULT NULL,
  `ID2` varchar(255) DEFAULT NULL,
  `regDate` varchar(255) DEFAULT NULL,
  `isComp` int(1) DEFAULT NULL,
  `active` int(1) DEFAULT '0',
  `privileges` varchar(255) DEFAULT 'user',
  `isRegistered` varchar(255) DEFAULT 'no',
  `compName` varchar(255) DEFAULT NULL,
  `compPostCode` int(11) DEFAULT NULL,
  `residence` varchar(255) DEFAULT NULL,
  `businessAd` varchar(255) DEFAULT NULL,
  `compHouseNr` int(11) DEFAULT NULL,
  `doc1` varchar(255) DEFAULT NULL,
  `doc2` varchar(255) DEFAULT NULL,
  `kycKey` varchar(255) DEFAULT NULL,
  `edited` varchar(255) DEFAULT NULL,
  `lastModified` varchar(255) DEFAULT NULL,
  `otpToken` varchar(255) DEFAULT NULL,
  `audio` varchar(255) DEFAULT NULL,
  `snapshot` varchar(255) DEFAULT NULL,
  `idNum` varchar(255) DEFAULT NULL,
  `idType` varchar(255) DEFAULT NULL,
  `kycHash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
)

 -- EthAddresses Table
 CREATE TABLE `ethAddresses` (
  `kycHash` varchar(255) DEFAULT NULL,
  `ethAddress` varchar(255) DEFAULT NULL
)


-- BeneficialOwners Table
CREATE TABLE `beneficialOwners` (
  `username` varchar(255) DEFAULT NULL,
  `ownerName` varchar(255) DEFAULT NULL,
  `ownerLastName` varchar(255) DEFAULT NULL,
  `ownerStreet` varchar(255) DEFAULT NULL,
  `ownerHouseNr` varchar(255) DEFAULT NULL,
  `ownerPostCode` int(11) DEFAULT NULL,
  `ownerPlaceOfRes` varchar(255) DEFAULT NULL,
  `ownerDateOfBirth` varchar(255) DEFAULT NULL
)