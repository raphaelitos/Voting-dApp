// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract Turing is ERC20 {
    using Strings for string;
     
    mapping(string => address) public users;
    mapping(address => string) public addresses;
    address private immutable owner;
    bool private voting = true;
    
    // Chave primária (string voter) => (Chave Secundária (string candidate) => Valor Final (bool))    
    mapping(string => mapping(string => bool)) public hasVote;
    
    mapping(string => uint256) public voteCount;
    event Voted(string indexed voter, string indexed candidate, uint256 amount);

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    constructor() ERC20("RaphaTuring", "RT"){
        users["roberta"] = 0x502542668aF09fa7aea52174b9965A7799343Df7;
        users["nome1"] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        users["nome2"] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        users["nome3"] = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        users["nome4"] = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;
        users["nome5"] = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc;

        addresses[users["roberta"]] = "roberta";
        addresses[users["nome1"]] = "nome1";
        addresses[users["nome2"]] = "nome2";
        addresses[users["nome3"]] = "nome3";
        addresses[users["nome4"]] = "nome4";
        addresses[users["nome5"]] = "nome5";

        owner = msg.sender;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == owner || msg.sender == users["roberta"],
            "Apenas o dono do contrato ou a Roberta podem executar essa acao!"
        );
        _;
    }

    function updateUser(string memory codinome, address user_addr) public onlyAdmin() {
        require(!codinome.equal(""), "Erro: codinome nao pode ser vazio");
        require(user_addr != address(0), "Erro: endereco invalido");

        // Evita que o mesmo endereco responda por dois codinomes (corromperia `addresses`)
        string memory current = addresses[user_addr];
        require(
            bytes(current).length == 0 || current.equal(codinome),
            "Erro: endereco ja pertence a outro codinome"
        );

        // So apaga o mapeamento reverso antigo se ele realmente apontar para este codinome
        address old_add = users[codinome];
        if (old_add != address(0) && addresses[old_add].equal(codinome)) {
            delete addresses[old_add];
        }

        users[codinome] = user_addr;
        addresses[user_addr] = codinome;
    }

    function votingOn() public onlyAdmin(){
        voting = true;
    }

    function votingOff() public onlyAdmin(){
        voting = false;
    }

    function issueToken(string memory codinome, uint256 qtde_Turings) public onlyAdmin(){
        require(users[codinome] != address(0), "Usuario nao existe");
        _mint(users[codinome], qtde_Turings);
    }

    function vote(string memory codinome, uint256 qtde_Turings) public {
        require(voting == true, "Erro: a votacao deve estar ativa!");
        require(!codinome.equal(""), "Erro: codinome de destino nao pode ser vazio");
        require(users[codinome] != address(0), "Erro: o candidato nao existe");
        
        string memory voterCodinome = addresses[msg.sender];
        
        require(!voterCodinome.equal(""), "Voce nao possui permissao para votar!");
        require(!voterCodinome.equal(codinome), "Voce nao pode votar em si mesmo!");
        require(qtde_Turings > 0 && qtde_Turings <= 2, "A quantidade de turings deve ser maior que 0 e menor ou igual a 2");

        require(hasVote[voterCodinome][codinome] == false, "Voce ja votou neste codinome!");

        hasVote[voterCodinome][codinome] = true;

        voteCount[voterCodinome] += 1;

        _mint(users[codinome], qtde_Turings);

        if (voteCount[voterCodinome] % 10 == 0) {
            _mint(msg.sender, 1);
        }

        emit Voted(voterCodinome, codinome, qtde_Turings);
    }
}